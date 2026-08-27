from datetime import date
from decimal import Decimal
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
    """

    @staticmethod
    def get_summary_for_user(user: User) -> dict:
        role_name = user.role.name
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

        # Global Inventory Baseline
        total_spaces = AdvertisingSpace.query.filter_by(is_active=True).count()
        occupied_spaces = SpaceAvailability.query.filter(
            SpaceAvailability.is_booked.is_(True),
            SpaceAvailability.start_date <= today,
            SpaceAvailability.end_date >= today
        ).distinct(SpaceAvailability.space_id).count()
        available_spaces = max(0, total_spaces - occupied_spaces)

        # Global Bookings Baseline
        total_bookings = Booking.query.count()
        active_bookings = Booking.query.filter(
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_date <= today,
            Booking.end_date >= today
        ).count()
        pending_bookings = Booking.query.filter_by(status=BookingStatus.PENDING).count()

        # Global Campaigns Baseline
        total_campaigns = Campaign.query.count()
        active_campaigns = Campaign.query.filter_by(status=CampaignStatus.ACTIVE).count()

        # Global Financials Baseline
        all_invoices = Invoice.query.filter(Invoice.status != InvoiceStatus.CANCELLED).all()
        global_invoiced = sum((Decimal(str(inv.total_amount)) for inv in all_invoices), Decimal("0.00"))
        global_collected = sum((Decimal(str(inv.amount_paid)) for inv in all_invoices), Decimal("0.00"))
        global_outstanding = max(Decimal("0.00"), global_invoiced - global_collected)
        pending_invoices_count = Invoice.query.filter(
            Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE])
        ).count()

        # Global Creatives Baseline
        pending_creatives = Creative.query.filter_by(status=MediaStatus.PENDING).count() if hasattr(Creative, 'status') else 0
        approved_creatives = Creative.query.filter_by(status=MediaStatus.APPROVED).count() if hasattr(Creative, 'status') else 0

        # =============================================================
        # 2. ROLE-SPECIFIC MODULES, ACTIONS & METRICS
        # =============================================================

        # -------------------------------------------------------------
        # A. ADVERTISER
        # -------------------------------------------------------------
        if role_name == "Advertiser":
            advertiser_id = user.advertiser_id
            user_id = user.id

            # Personal Campaigns
            my_campaigns = Campaign.query.filter_by(user_id=user_id)
            adv_total_campaigns = my_campaigns.count()
            adv_active_campaigns = my_campaigns.filter_by(status=CampaignStatus.ACTIVE).count()

            # Personal Bookings
            my_bookings = Booking.query.filter_by(user_id=user_id)
            adv_total_bookings = my_bookings.count()
            adv_active_bookings = my_bookings.filter(
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
                Booking.start_date <= today,
                Booking.end_date >= today
            ).count()
            adv_pending_bookings = my_bookings.filter_by(status=BookingStatus.PENDING).count()

            # Personal Invoices & Balances (Checking user_id or advertiser_id)
            adv_invoices = Invoice.query.join(Invoice.campaign).filter(
                db.or_(
                    Invoice.advertiser_id == advertiser_id,
                    Campaign.user_id == user_id
                )
            ).filter(Invoice.status != InvoiceStatus.CANCELLED).all()

            adv_invoiced = sum((Decimal(str(inv.total_amount)) for inv in adv_invoices), Decimal("0.00"))
            adv_paid = sum((Decimal(str(inv.amount_paid)) for inv in adv_invoices), Decimal("0.00"))
            adv_outstanding = max(Decimal("0.00"), adv_invoiced - adv_paid)

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
                    "campaigns": {
                        "total": adv_total_campaigns,
                        "active": adv_active_campaigns,
                        "total_campaigns": adv_total_campaigns,
                        "active_campaigns": adv_active_campaigns
                    },
                    "bookings": {
                        "total": adv_total_bookings,
                        "active": adv_active_bookings,
                        "pending": adv_pending_bookings,
                        "total_bookings": adv_total_bookings,
                        "active_bookings": adv_active_bookings,
                        "pending_bookings": adv_pending_bookings
                    },
                    "financials": {
                        "total_invoiced": str(adv_invoiced),
                        "total_paid": str(adv_paid),
                        "total_collected": str(adv_paid),
                        "outstanding_balance": str(adv_outstanding),
                        "unsettled_invoices_count": len([i for i in adv_invoices if i.status != InvoiceStatus.PAID])
                    }
                }
            }

        # -------------------------------------------------------------
        # B. SPACE MANAGER
        # -------------------------------------------------------------
        elif role_name == "Space Manager":
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