from datetime import date
from decimal import Decimal
from sqlalchemy.orm import joinedload
from app.extensions import db
from app.models.space import AdvertisingSpace, SpaceAvailability
from app.models.booking import Booking, BookingStatus
from app.models.campaign import Campaign, CampaignStatus
from app.models.payment import Invoice, InvoiceStatus, Payment, PaymentStatus
from app.models.creative import Creative, MediaStatus
from app.models.user import User


class DashboardService:
    """
    Calculates unified identity context, accessible modules,
    and real-time operational analytics for all 6 system roles.
    Optimized for high-concurrency and remote cloud database latencies.
    """

    @staticmethod
    def get_summary_for_user(user: User) -> dict:
        role_name = user.role.name if user.role else "Advertiser"
        today = date.today()

        # =============================================================
        # 1. CORE USER IDENTITY & PERMISSION CONTEXT
        # =============================================================
        profile_data = {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role_name,
            "permissions": user.role.permissions if user.role else {},
            "is_active": user.is_active,
            "advertiser": {
                "id": user.advertiser.id,
                "company_name": user.advertiser.company_name,
                "tax_number": user.advertiser.tax_number
            } if user.advertiser else None
        }

        # -------------------------------------------------------------
        # Inventory Baseline (Shared by all roles)
        # -------------------------------------------------------------
        total_spaces = AdvertisingSpace.query.filter_by(is_active=True).count()
        occupied_spaces = SpaceAvailability.query.filter(
            SpaceAvailability.is_booked.is_(True),
            SpaceAvailability.start_date <= today,
            SpaceAvailability.end_date >= today
        ).distinct(SpaceAvailability.space_id).count()
        available_spaces = max(0, total_spaces - occupied_spaces)

        # =============================================================
        # 2. ROLE-SPECIFIC MODULES, ACTIONS & METRICS
        # =============================================================

        # -------------------------------------------------------------
        # A. ADVERTISER (Role-Scoped Single-Pass Queries)
        # -------------------------------------------------------------
        if role_name == "Advertiser":
            advertiser_id = user.advertiser_id
            user_id = user.id

            # 1. Campaigns stats (single aggregate query)
            adv_c_stats = db.session.query(
                db.func.count(Campaign.id),
                db.func.count(db.case((Campaign.status == CampaignStatus.ACTIVE, 1)))
            ).filter(Campaign.user_id == user_id).first()
            adv_total_campaigns = adv_c_stats[0] if adv_c_stats else 0
            adv_active_campaigns = adv_c_stats[1] if adv_c_stats else 0

            # 2. Bookings & Flight breakdown (single eager-loaded query to avoid N+1)
            all_user_bookings = Booking.query.options(
                joinedload(Booking.space).joinedload(AdvertisingSpace.location),
                joinedload(Booking.campaign)
            ).filter_by(user_id=user_id).order_by(Booking.created_at.desc()).all()

            adv_total_bookings = len(all_user_bookings)
            adv_live_bookings = 0
            adv_scheduled_bookings = 0
            adv_pending_bookings = 0
            adv_completed_bookings = 0

            active_services = []
            for b in all_user_bookings:
                if b.status == BookingStatus.PENDING:
                    adv_pending_bookings += 1
                    flight_state = "PENDING_APPROVAL"
                elif b.status == BookingStatus.COMPLETED or (b.status == BookingStatus.CONFIRMED and b.end_date < today):
                    adv_completed_bookings += 1
                    flight_state = "COMPLETED"
                elif b.status == BookingStatus.CONFIRMED and b.start_date <= today <= b.end_date:
                    adv_live_bookings += 1
                    flight_state = "ACTIVE_FLIGHT"
                elif b.status == BookingStatus.CONFIRMED and b.start_date > today:
                    adv_scheduled_bookings += 1
                    flight_state = "SCHEDULED"
                else:
                    adv_completed_bookings += 1
                    flight_state = "COMPLETED"

                if len(active_services) < 5:
                    active_services.append({
                        "id": b.id,
                        "booking_reference": b.booking_reference,
                        "space_name": b.space.name if b.space else f"Space #{b.space_id}",
                        "space_city": b.space.location.city if (b.space and b.space.location) else "Karachi",
                        "campaign_name": b.campaign.name if b.campaign else "Direct Booking",
                        "start_date": b.start_date.isoformat(),
                        "end_date": b.end_date.isoformat(),
                        "status": b.status.value if hasattr(b.status, 'value') else str(b.status),
                        "flight_state": flight_state,
                        "total_price": str(b.total_price)
                    })

            # 3. Creatives breakdown (single aggregate query)
            cr_adv_stats = db.session.query(
                db.func.count(Creative.id),
                db.func.count(db.case((Creative.status == MediaStatus.APPROVED, 1))),
                db.func.count(db.case((Creative.status == MediaStatus.PENDING, 1)))
            ).join(Campaign, Creative.campaign_id == Campaign.id).filter(Campaign.user_id == user_id).first()

            adv_total_creatives = cr_adv_stats[0] if cr_adv_stats else 0
            adv_approved_creatives = cr_adv_stats[1] if cr_adv_stats else 0
            adv_pending_creatives = cr_adv_stats[2] if cr_adv_stats else 0

            # 4. Invoices & Balances (SQL queries)
            adv_invoiced = db.session.query(
                db.func.coalesce(db.func.sum(Invoice.total_amount), Decimal("0.00"))
            ).outerjoin(Campaign, Invoice.campaign_id == Campaign.id).filter(
                db.or_(
                    Invoice.advertiser_id == advertiser_id,
                    Campaign.user_id == user_id
                ),
                Invoice.status != InvoiceStatus.CANCELLED
            ).scalar() or Decimal("0.00")

            adv_paid = db.session.query(
                db.func.coalesce(db.func.sum(Payment.amount), Decimal("0.00"))
            ).join(Invoice, Payment.invoice_id == Invoice.id).outerjoin(Campaign, Invoice.campaign_id == Campaign.id).filter(
                db.or_(
                    Invoice.advertiser_id == advertiser_id,
                    Campaign.user_id == user_id
                ),
                Payment.status == PaymentStatus.COMPLETED
            ).scalar() or Decimal("0.00")

            adv_outstanding = max(Decimal("0.00"), adv_invoiced - adv_paid)

            unsettled_invoices_count = db.session.query(
                db.func.count(Invoice.id)
            ).outerjoin(Campaign, Invoice.campaign_id == Campaign.id).filter(
                db.or_(
                    Invoice.advertiser_id == advertiser_id,
                    Campaign.user_id == user_id
                ),
                Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE])
            ).scalar() or 0

            fulfillment_rate = round(
                ((adv_live_bookings + adv_completed_bookings) / adv_total_bookings * 100)
                if adv_total_bookings > 0 else 100.0,
                1
            )
            clearance_rate = round(
                (float(adv_paid) / float(adv_invoiced) * 100)
                if adv_invoiced > 0 else 100.0,
                1
            )

            return {
                "profile": profile_data,
                "accessible_modules": [
                    "spaces_catalog",
                    "availability_calendar",
                    "my_campaigns",
                    "my_bookings",
                    "my_invoices",
                    "creative_uploads"
                ],
                "quick_actions": [
                    {"label": "Browse Inventory", "route": "/spaces"},
                    {"label": "Check Availability", "route": "/availability"},
                    {"label": "Create New Campaign", "route": "/campaigns"},
                    {"label": "Book Advertising Space", "route": "/spaces"},
                    {"label": "View Invoices & Pay", "route": "/payments"}
                ],
                "metrics": {
                    "inventory": {
                        "total_spaces": total_spaces,
                        "available_spaces": available_spaces,
                        "occupied_spaces": occupied_spaces
                    },
                    "services": {
                        "live_flights": adv_live_bookings,
                        "scheduled_flights": adv_scheduled_bookings,
                        "pending_flights": adv_pending_bookings,
                        "completed_flights": adv_completed_bookings,
                        "total_flights": adv_total_bookings,
                        "creatives_approved": adv_approved_creatives,
                        "creatives_pending": adv_pending_creatives,
                        "creatives_total": adv_total_creatives,
                        "fulfillment_rate": fulfillment_rate,
                        "clearance_rate": clearance_rate
                    },
                    "active_services": active_services,
                    "campaigns": {
                        "total": adv_total_campaigns,
                        "active": adv_active_campaigns,
                        "total_campaigns": adv_total_campaigns,
                        "active_campaigns": adv_active_campaigns
                    },
                    "bookings": {
                        "total": adv_total_bookings,
                        "active": adv_live_bookings,
                        "pending": adv_pending_bookings,
                        "total_bookings": adv_total_bookings,
                        "active_bookings": adv_live_bookings,
                        "pending_bookings": adv_pending_bookings
                    },
                    "financials": {
                        "total_invoiced": str(adv_invoiced),
                        "total_paid": str(adv_paid),
                        "total_collected": str(adv_paid),
                        "outstanding_balance": str(adv_outstanding),
                        "unsettled_invoices_count": unsettled_invoices_count
                    }
                }
            }

        # -------------------------------------------------------------
        # GLOBAL METRICS (For Staff, Reviewer, Manager & Admin Roles)
        # Computed using consolidated high-speed SQL aggregates
        # -------------------------------------------------------------

        # 1. Global Bookings Baseline (1 query)
        b_stats = db.session.query(
            db.func.count(Booking.id),
            db.func.count(db.case((db.and_(Booking.status == BookingStatus.CONFIRMED, Booking.start_date <= today, Booking.end_date >= today), 1))),
            db.func.count(db.case((Booking.status == BookingStatus.PENDING, 1)))
        ).first()
        total_bookings = b_stats[0] if b_stats else 0
        active_bookings = b_stats[1] if b_stats else 0
        pending_bookings = b_stats[2] if b_stats else 0

        # 2. Global Campaigns Baseline (1 query)
        c_stats = db.session.query(
            db.func.count(Campaign.id),
            db.func.count(db.case((Campaign.status == CampaignStatus.ACTIVE, 1)))
        ).first()
        total_campaigns = c_stats[0] if c_stats else 0
        active_campaigns = c_stats[1] if c_stats else 0

        # 3. Global Financials Baseline (SQL queries)
        global_invoiced = db.session.query(
            db.func.coalesce(db.func.sum(Invoice.total_amount), Decimal("0.00"))
        ).filter(Invoice.status != InvoiceStatus.CANCELLED).scalar() or Decimal("0.00")

        global_collected = db.session.query(
            db.func.coalesce(db.func.sum(Payment.amount), Decimal("0.00"))
        ).filter(Payment.status == PaymentStatus.COMPLETED).scalar() or Decimal("0.00")

        global_outstanding = max(Decimal("0.00"), global_invoiced - global_collected)

        pending_invoices_count = db.session.query(
            db.func.count(Invoice.id)
        ).filter(Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE])).scalar() or 0


        # 4. Global Creatives Baseline (1 query)
        cr_stats = db.session.query(
            db.func.count(db.case((Creative.status == MediaStatus.PENDING, 1))),
            db.func.count(db.case((Creative.status == MediaStatus.APPROVED, 1)))
        ).first() if hasattr(Creative, 'status') else (0, 0)
        pending_creatives = cr_stats[0] if cr_stats else 0
        approved_creatives = cr_stats[1] if cr_stats else 0

        # -------------------------------------------------------------
        # B. SPACE MANAGER
        # -------------------------------------------------------------
        if role_name == "Space Manager":
            return {
                "profile": profile_data,
                "accessible_modules": [
                    "inventory_management",
                    "locations_categories",
                    "rate_cards",
                    "availability_calendar",
                    "booking_approvals"
                ],
                "quick_actions": [
                    {"label": "Add New Space", "route": "/spaces"},
                    {"label": "Check Availability", "route": "/availability"},
                    {"label": "Review Pending Bookings", "route": "/bookings"}
                ],
                "metrics": {
                    "inventory": {
                        "total_spaces": total_spaces,
                        "available_spaces": available_spaces,
                        "occupied_spaces": occupied_spaces,
                        "total_active_spaces": total_spaces,
                        "currently_occupied": occupied_spaces,
                        "currently_available": available_spaces,
                        "occupancy_rate_percent": round((occupied_spaces / total_spaces * 100), 2) if total_spaces > 0 else 0
                    },
                    "bookings": {
                        "total": total_bookings,
                        "active": active_bookings,
                        "pending": pending_bookings,
                        "total_bookings": total_bookings,
                        "active_bookings": active_bookings,
                        "pending_bookings": pending_bookings
                    },
                    "campaigns": {
                        "total": total_campaigns,
                        "active": active_campaigns,
                        "total_campaigns": total_campaigns,
                        "active_campaigns": active_campaigns
                    },
                    "financials": {
                        "total_invoiced": str(global_invoiced),
                        "total_paid": str(global_collected),
                        "total_collected": str(global_collected),
                        "outstanding_balance": str(global_outstanding),
                        "unsettled_invoices_count": pending_invoices_count
                    }
                }
            }

        # -------------------------------------------------------------
        # C. SALES EXECUTIVE
        # -------------------------------------------------------------
        elif role_name == "Sales Executive":
            return {
                "profile": profile_data,
                "accessible_modules": [
                    "campaigns_pipeline",
                    "booking_management",
                    "inventory_browser",
                    "invoices_ledger"
                ],
                "quick_actions": [
                    {"label": "Launch New Campaign", "route": "/campaigns"},
                    {"label": "Review Bookings", "route": "/bookings"},
                    {"label": "Check Space Availability", "route": "/availability"},
                    {"label": "View Client Invoices", "route": "/payments"}
                ],
                "metrics": {
                    "inventory": {
                        "total_spaces": total_spaces,
                        "available_spaces": available_spaces,
                        "occupied_spaces": occupied_spaces
                    },
                    "campaigns": {
                        "total": total_campaigns,
                        "active": active_campaigns,
                        "total_campaigns": total_campaigns,
                        "active_campaigns": active_campaigns
                    },
                    "bookings": {
                        "total": total_bookings,
                        "active": active_bookings,
                        "pending": pending_bookings,
                        "total_bookings": total_bookings,
                        "active_bookings": active_bookings,
                        "pending_bookings": pending_bookings
                    },
                    "financials": {
                        "total_invoiced": str(global_invoiced),
                        "total_paid": str(global_collected),
                        "total_collected": str(global_collected),
                        "outstanding_balance": str(global_outstanding),
                        "unsettled_invoices_count": pending_invoices_count
                    },
                    "sales_pipeline": {
                        "total_campaigns": total_campaigns,
                        "active_campaigns": active_campaigns,
                        "pending_bookings": pending_bookings,
                        "active_bookings": active_bookings
                    }
                }
            }

        # -------------------------------------------------------------
        # D. FINANCE OFFICER
        # -------------------------------------------------------------
        elif role_name == "Finance Officer":
            return {
                "profile": profile_data,
                "accessible_modules": [
                    "invoices_ledger",
                    "payments_reconciliation",
                    "financial_reports"
                ],
                "quick_actions": [
                    {"label": "View Invoices", "route": "/payments"},
                    {"label": "Reconcile Settlements", "route": "/payments"}
                ],
                "metrics": {
                    "inventory": {
                        "total_spaces": total_spaces,
                        "available_spaces": available_spaces,
                        "occupied_spaces": occupied_spaces
                    },
                    "campaigns": {
                        "total": total_campaigns,
                        "active": active_campaigns,
                        "total_campaigns": total_campaigns,
                        "active_campaigns": active_campaigns
                    },
                    "bookings": {
                        "total": total_bookings,
                        "active": active_bookings,
                        "pending": pending_bookings,
                        "total_bookings": total_bookings,
                        "active_bookings": active_bookings,
                        "pending_bookings": pending_bookings
                    },
                    "financials": {
                        "total_invoiced": str(global_invoiced),
                        "total_paid": str(global_collected),
                        "total_collected": str(global_collected),
                        "outstanding_balance": str(global_outstanding),
                        "unsettled_invoices_count": pending_invoices_count
                    }
                }
            }

        # -------------------------------------------------------------
        # E. CREATIVE REVIEWER
        # -------------------------------------------------------------
        elif role_name == "Creative Reviewer":
            return {
                "profile": profile_data,
                "accessible_modules": [
                    "creatives_review_queue",
                    "approval_history"
                ],
                "quick_actions": [
                    {"label": "Review Pending Creatives", "route": "/creatives"},
                    {"label": "Approved Media Library", "route": "/creatives"}
                ],
                "metrics": {
                    "inventory": {
                        "total_spaces": total_spaces,
                        "available_spaces": available_spaces,
                        "occupied_spaces": occupied_spaces
                    },
                    "campaigns": {
                        "total": total_campaigns,
                        "active": active_campaigns,
                        "total_campaigns": total_campaigns,
                        "active_campaigns": active_campaigns
                    },
                    "bookings": {
                        "total": total_bookings,
                        "active": active_bookings,
                        "pending": pending_bookings,
                        "total_bookings": total_bookings,
                        "active_bookings": active_bookings,
                        "pending_bookings": pending_bookings
                    },
                    "financials": {
                        "total_invoiced": str(global_invoiced),
                        "total_paid": str(global_collected),
                        "total_collected": str(global_collected),
                        "outstanding_balance": str(global_outstanding),
                        "unsettled_invoices_count": pending_invoices_count
                    },
                    "creative_queue": {
                        "pending_reviews": pending_creatives,
                        "approved_today": approved_creatives,
                        "rejected_today": 0
                    }
                }
            }

        # -------------------------------------------------------------
        # F. ADMINISTRATOR (Full Panoramic Platform View)
        # -------------------------------------------------------------
        return {
            "profile": profile_data,
            "accessible_modules": [
                "user_management",
                "space_inventory",
                "campaign_management",
                "booking_management",
                "invoice_billing",
                "payments_ledger",
                "creatives_approvals",
                "audit_logs"
            ],
            "quick_actions": [
                {"label": "Manage Users", "route": "/users"},
                {"label": "Create Space Inventory", "route": "/spaces"},
                {"label": "Review All Bookings", "route": "/bookings"},
                {"label": "System Financial Overview", "route": "/payments"},
                {"label": "View Audit Trail", "route": "/audit"}
            ],
            "metrics": {
                "inventory": {
                    "total_spaces": total_spaces,
                    "available_spaces": available_spaces,
                    "occupied_spaces": occupied_spaces
                },
                "bookings": {
                    "total": total_bookings,
                    "active": active_bookings,
                    "pending": pending_bookings,
                    "total_bookings": total_bookings,
                    "active_bookings": active_bookings,
                    "pending_bookings": pending_bookings
                },
                "campaigns": {
                    "total": total_campaigns,
                    "active": active_campaigns,
                    "total_campaigns": total_campaigns,
                    "active_campaigns": active_campaigns
                },
                "financials": {
                    "total_invoiced": str(global_invoiced),
                    "total_paid": str(global_collected),
                    "total_collected": str(global_collected),
                    "outstanding_balance": str(global_outstanding),
                    "unsettled_invoices_count": pending_invoices_count,
                    "pending_invoices": pending_invoices_count
                }
            }
        }