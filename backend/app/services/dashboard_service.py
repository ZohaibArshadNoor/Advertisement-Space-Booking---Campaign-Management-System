from datetime import date
from decimal import Decimal

from app.models.space import AdvertisingSpace, SpaceAvailability
from app.models.booking import Booking, BookingStatus
from app.models.campaign import Campaign, CampaignStatus
from app.models.payment import Invoice, InvoiceStatus, Payment, PaymentStatus
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
            "permissions": user.role.permissions,
            "is_active": user.is_active,
            "advertiser": {
                "id": user.advertiser.id,
                "company_name": user.advertiser.company_name,
                "tax_number": user.advertiser.tax_number
            } if user.advertiser else None
        }

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
            total_campaigns = my_campaigns.count()
            active_campaigns = my_campaigns.filter_by(status=CampaignStatus.ACTIVE).count()

            # Personal Bookings
            my_bookings = Booking.query.filter_by(user_id=user_id)
            total_bookings = my_bookings.count()
            active_bookings = my_bookings.filter(
                Booking.status == BookingStatus.CONFIRMED,
                Booking.start_date <= today,
                Booking.end_date >= today
            ).count()
            pending_bookings = my_bookings.filter_by(status=BookingStatus.PENDING).count()

            # Personal Invoices & Balances
            my_invoices = Invoice.query
            if advertiser_id:
                my_invoices = my_invoices.filter_by(advertiser_id=advertiser_id)
            else:
                my_invoices = my_invoices.join(Campaign).filter(Campaign.user_id == user_id)

            active_invoices = my_invoices.filter(Invoice.status != InvoiceStatus.CANCELLED).all()
            total_invoiced = sum((Decimal(inv.total_amount) for inv in active_invoices), Decimal("0.00"))
            total_paid = sum((inv.amount_paid for inv in active_invoices), Decimal("0.00"))
            outstanding_balance = max(Decimal("0.00"), total_invoiced - total_paid)

            return {
                "profile": profile_data,
                "accessible_modules": [
                    "spaces_catalog",
                    "availability_calendar",
                    "my_campaigns",
                    "my_bookings",
                    "my_invoices",
                    "creative_uploads",
                    "support_complaints"
                ],
                "quick_actions": [
                    {"label": "Browse Inventory", "route": "/spaces"},
                    {"label": "Check Availability", "route": "/availability"},
                    {"label": "Create New Campaign", "route": "/campaigns/create"},
                    {"label": "Book Advertising Space", "route": "/bookings/create"},
                    {"label": "View Invoices & Pay", "route": "/invoices"}
                ],
                "metrics": {
                    "campaigns": {
                        "total": total_campaigns,
                        "active": active_campaigns
                    },
                    "bookings": {
                        "total": total_bookings,
                        "active_today": active_bookings,
                        "pending_approval": pending_bookings
                    },
                    "financials": {
                        "total_invoiced": str(total_invoiced),
                        "total_paid": str(total_paid),
                        "outstanding_balance": str(outstanding_balance),
                        "unsettled_invoices_count": len([i for i in active_invoices if i.status != InvoiceStatus.PAID])
                    }
                }
            }

        # -------------------------------------------------------------
        # B. SPACE MANAGER
        # -------------------------------------------------------------
        elif role_name == "Space Manager":
            total_spaces = AdvertisingSpace.query.filter_by(is_active=True).count()
            occupied_spaces = SpaceAvailability.query.filter(
                SpaceAvailability.is_booked.is_(True),
                SpaceAvailability.start_date <= today,
                SpaceAvailability.end_date >= today
            ).distinct(SpaceAvailability.space_id).count()
            available_spaces = max(0, total_spaces - occupied_spaces)

            total_bookings = Booking.query.count()
            active_bookings = Booking.query.filter(
                Booking.status == BookingStatus.CONFIRMED,
                Booking.start_date <= today,
                Booking.end_date >= today
            ).count()
            pending_bookings = Booking.query.filter_by(status=BookingStatus.PENDING).count()

            return {
                "profile": profile_data,
                "accessible_modules": [
                    "inventory_management",
                    "locations_categories",
                    "rate_cards",
                    "availability_calendar",
                    "booking_approvals",
                    "execution_proofs"
                ],
                "quick_actions": [
                    {"label": "Add New Space", "route": "/spaces/create"},
                    {"label": "Manage Rate Cards", "route": "/spaces/rates"},
                    {"label": "Review Pending Bookings", "route": "/bookings?status=PENDING"},
                    {"label": "Block Maintenance Dates", "route": "/availability/create"}
                ],
                "metrics": {
                    "inventory": {
                        "total_active_spaces": total_spaces,
                        "currently_occupied": occupied_spaces,
                        "currently_available": available_spaces,
                        "occupancy_rate_percent": round((occupied_spaces / total_spaces * 100), 2) if total_spaces > 0 else 0
                    },
                    "bookings": {
                        "active_today": active_bookings,
                        "pending_approval": pending_bookings,
                        "total_all_time": total_bookings
                    }
                }
            }

        # -------------------------------------------------------------
        # C. SALES EXECUTIVE
        # -------------------------------------------------------------
        elif role_name == "Sales Executive":
            total_campaigns = Campaign.query.count()
            active_campaigns = Campaign.query.filter_by(status=CampaignStatus.ACTIVE).count()
            pending_bookings = Booking.query.filter_by(status=BookingStatus.PENDING).count()
            active_bookings = Booking.query.filter(
                Booking.status == BookingStatus.CONFIRMED,
                Booking.start_date <= today,
                Booking.end_date >= today
            ).count()

            return {
                "profile": profile_data,
                "accessible_modules": [
                    "clients_advertisers",
                    "campaigns_pipeline",
                    "quotations",
                    "bookings_entry",
                    "inventory_browser"
                ],
                "quick_actions": [
                    {"label": "New Client Onboarding", "route": "/advertisers/create"},
                    {"label": "Create Quotation", "route": "/quotations/create"},
                    {"label": "Submit Booking", "route": "/bookings/create"},
                    {"label": "Check Inventory Availability", "route": "/availability"}
                ],
                "metrics": {
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
            invoices = Invoice.query.filter(Invoice.status != InvoiceStatus.CANCELLED).all()
            total_invoiced = sum((Decimal(inv.total_amount) for inv in invoices), Decimal("0.00"))
            total_collected = sum((inv.amount_paid for inv in invoices), Decimal("0.00"))
            outstanding_balance = max(Decimal("0.00"), total_invoiced - total_collected)
            pending_invoices_count = Invoice.query.filter(
                Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE])
            ).count()

            return {
                "profile": profile_data,
                "accessible_modules": [
                    "invoices_ledger",
                    "payments_reconciliation",
                    "advertisers_credit",
                    "financial_reports"
                ],
                "quick_actions": [
                    {"label": "Generate Campaign Invoice", "route": "/invoices/create"},
                    {"label": "Record Received Payment", "route": "/payments/create"},
                    {"label": "Review Unsettled Invoices", "route": "/invoices?status=ISSUED"}
                ],
                "metrics": {
                    "financials": {
                        "total_invoiced": str(total_invoiced),
                        "total_collected": str(total_collected),
                        "outstanding_balance": str(outstanding_balance),
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
                    "approval_history",
                    "compliance_guidelines"
                ],
                "quick_actions": [
                    {"label": "Review Pending Creatives", "route": "/creatives?status=PENDING"},
                    {"label": "View Live Campaign Creatives", "route": "/creatives?status=APPROVED"}
                ],
                "metrics": {
                    "creative_queue": {
                        "pending_reviews": 0,
                        "approved_today": 0,
                        "rejected_today": 0
                    }
                }
            }

        # -------------------------------------------------------------
        # F. ADMINISTRATOR (Panoramic View)
        # -------------------------------------------------------------
        total_spaces = AdvertisingSpace.query.filter_by(is_active=True).count()
        occupied_spaces = SpaceAvailability.query.filter(
            SpaceAvailability.is_booked.is_(True),
            SpaceAvailability.start_date <= today,
            SpaceAvailability.end_date >= today
        ).distinct(SpaceAvailability.space_id).count()
        available_spaces = max(0, total_spaces - occupied_spaces)

        total_bookings = Booking.query.count()
        active_bookings = Booking.query.filter(
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_date <= today,
            Booking.end_date >= today
        ).count()
        pending_bookings = Booking.query.filter_by(status=BookingStatus.PENDING).count()

        total_campaigns = Campaign.query.count()
        active_campaigns = Campaign.query.filter_by(status=CampaignStatus.ACTIVE).count()

        invoices = Invoice.query.filter(Invoice.status != InvoiceStatus.CANCELLED).all()
        total_invoiced = sum((Decimal(inv.total_amount) for inv in invoices), Decimal("0.00"))
        total_collected = sum((inv.amount_paid for inv in invoices), Decimal("0.00"))
        outstanding_balance = max(Decimal("0.00"), total_invoiced - total_collected)
        pending_invoices_count = Invoice.query.filter(
            Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE])
        ).count()

        return {
            "profile": profile_data,
            "accessible_modules": [
                "user_management",
                "role_permissions",
                "space_inventory",
                "rate_cards",
                "availability_schedules",
                "campaign_management",
                "booking_management",
                "invoice_billing",
                "payments_ledger",
                "creatives_approvals",
                "audit_logs",
                "system_settings"
            ],
            "quick_actions": [
                {"label": "Manage Users & Roles", "route": "/users"},
                {"label": "Create Space Inventory", "route": "/spaces/create"},
                {"label": "Review All Bookings", "route": "/bookings"},
                {"label": "System Financial Overview", "route": "/invoices"},
                {"label": "View Audit Trail", "route": "/audit"}
            ],
            "metrics": {
                "inventory": {
                    "total_spaces": total_spaces,
                    "available_spaces": available_spaces,
                    "occupied_spaces": occupied_spaces
                },
                "bookings": {
                    "total_bookings": total_bookings,
                    "active_bookings": active_bookings,
                    "pending_bookings": pending_bookings
                },
                "campaigns": {
                    "total_campaigns": total_campaigns,
                    "active_campaigns": active_campaigns
                },
                "financials": {
                    "total_invoiced": str(total_invoiced),
                    "total_collected": str(total_collected),
                    "outstanding_balance": str(outstanding_balance),
                    "pending_invoices": pending_invoices_count
                }
            }
        }