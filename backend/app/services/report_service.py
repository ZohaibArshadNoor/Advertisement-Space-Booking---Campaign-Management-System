from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy import func

from app.extensions import db
from app.models.space import AdvertisingSpace, SpaceAvailability
from app.models.booking import Booking, BookingStatus
from app.models.campaign import Campaign, CampaignStatus
from app.models.payment import Invoice, InvoiceStatus, Payment, PaymentStatus


class ReportService:
    """
    Business intelligence service for generating financial,
    utilization, booking, and campaign reports.
    """

    # =========================================================================
    # 1. REVENUE REPORT
    # =========================================================================
    @staticmethod
    def get_revenue_report(
        start_date: date = None,
        end_date: date = None,
        advertiser_id: int = None
    ) -> dict:
        """
        Calculates financial analytics across invoiced amounts,
        collected payments, outstanding balances, and payment methods.
        """
        # Default to the last 30 days if date range not specified
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        # 1. SQL Aggregated Invoices query
        inv_base = db.session.query(
            func.coalesce(func.sum(Invoice.subtotal), Decimal("0.00")),
            func.coalesce(func.sum(Invoice.tax), Decimal("0.00")),
            func.coalesce(func.sum(Invoice.total_amount), Decimal("0.00")),
            func.count(Invoice.id)
        ).filter(
            Invoice.created_at >= start_date,
            Invoice.created_at <= end_date + timedelta(days=1),
            Invoice.status != InvoiceStatus.CANCELLED
        )
        if advertiser_id:
            inv_base = inv_base.filter(Invoice.advertiser_id == advertiser_id)

        total_subtotal, total_tax, total_invoiced, total_invoices_count = inv_base.first()

        # 2. SQL Aggregated Payments query
        pay_base = db.session.query(
            func.coalesce(func.sum(Payment.amount), Decimal("0.00")),
            func.count(Payment.id)
        ).filter(
            Payment.paid_at >= start_date,
            Payment.paid_at <= end_date + timedelta(days=1),
            Payment.status == PaymentStatus.COMPLETED
        )
        if advertiser_id:
            pay_base = pay_base.join(Invoice).filter(Invoice.advertiser_id == advertiser_id)

        total_collected, total_payments_count = pay_base.first()
        outstanding_balance = max(Decimal("0.00"), Decimal(str(total_invoiced)) - Decimal(str(total_collected)))

        collection_rate = (
            round(float(Decimal(str(total_collected)) / Decimal(str(total_invoiced)) * 100), 2)
            if Decimal(str(total_invoiced)) > Decimal("0.00")
            else 0.0
        )

        # Payment methods breakdown via GROUP BY
        pay_group = db.session.query(
            Payment.payment_method,
            func.coalesce(func.sum(Payment.amount), Decimal("0.00"))
        ).filter(
            Payment.paid_at >= start_date,
            Payment.paid_at <= end_date + timedelta(days=1),
            Payment.status == PaymentStatus.COMPLETED
        )
        if advertiser_id:
            pay_group = pay_group.join(Invoice).filter(Invoice.advertiser_id == advertiser_id)

        payment_methods_breakdown = {row[0]: str(row[1]) for row in pay_group.group_by(Payment.payment_method).all()}

        # Status breakdown via GROUP BY
        inv_group = db.session.query(
            Invoice.status,
            func.count(Invoice.id)
        ).filter(
            Invoice.created_at >= start_date,
            Invoice.created_at <= end_date + timedelta(days=1),
            Invoice.status != InvoiceStatus.CANCELLED
        )
        if advertiser_id:
            inv_group = inv_group.filter(Invoice.advertiser_id == advertiser_id)

        invoice_status_counts = {row[0]: row[1] for row in inv_group.group_by(Invoice.status).all()}

        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days_in_period": (end_date - start_date).days + 1
            },
            "financial_summary": {
                "total_invoiced": str(total_invoiced),
                "total_subtotal": str(total_subtotal),
                "total_tax": str(total_tax),
                "total_collected": str(total_collected),
                "outstanding_balance": str(outstanding_balance),
                "collection_rate_percentage": collection_rate
            },
            "payment_methods_breakdown": payment_methods_breakdown,
            "invoice_status_distribution": invoice_status_counts,
            "total_invoices_issued": len(invoices),
            "total_payments_received": len(payments)
        }

    # =========================================================================
    # 2. SPACE UTILIZATION REPORT
    # =========================================================================
    @staticmethod
    def get_space_utilization_report(
        start_date: date = None,
        end_date: date = None
    ) -> dict:
        """
        Calculates space inventory utilization percentage:
        (Total Booked Space Days / (Total Active Spaces * Period Days)) * 100
        """
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        period_days = (end_date - start_date).days + 1
        active_spaces = AdvertisingSpace.query.filter_by(is_active=True).all()
        total_spaces_count = len(active_spaces)
        total_capacity_days = total_spaces_count * period_days

        # Confirmed booked intervals overlapping with this report period
        booked_schedules = SpaceAvailability.query.filter(
            SpaceAvailability.is_booked.is_(True),
            SpaceAvailability.start_date <= end_date,
            SpaceAvailability.end_date >= start_date
        ).all()

        total_booked_days = 0
        space_occupancy_counts = {}

        for schedule in booked_schedules:
            # Overlap calculation
            overlap_start = max(schedule.start_date, start_date)
            overlap_end = min(schedule.end_date, end_date)
            overlap_days = max(0, (overlap_end - overlap_start).days + 1)

            total_booked_days += overlap_days
            space_occupancy_counts[schedule.space_id] = (
                space_occupancy_counts.get(schedule.space_id, 0) + overlap_days
            )

        overall_utilization = (
            round(float(total_booked_days / total_capacity_days * 100), 2)
            if total_capacity_days > 0
            else 0.0
        )

        # Ranked space inventory utilization
        spaces_breakdown = []
        for s in active_spaces:
            days_occupied = space_occupancy_counts.get(s.id, 0)
            utilization_pct = (
                round(float(days_occupied / period_days * 100), 2)
                if period_days > 0
                else 0.0
            )
            spaces_breakdown.append({
                "space_id": s.id,
                "space_name": s.name,
                "location": s.location.city if s.location else "Unknown",
                "days_occupied": days_occupied,
                "days_available": period_days - days_occupied,
                "utilization_percentage": utilization_pct
            })

        # Sort spaces by highest utilization
        spaces_breakdown.sort(key=lambda x: x["utilization_percentage"], reverse=True)

        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "period_days": period_days
            },
            "utilization_summary": {
                "total_active_spaces": total_spaces_count,
                "total_capacity_days": total_capacity_days,
                "total_booked_days": total_booked_days,
                "overall_utilization_rate_percentage": overall_utilization
            },
            "spaces_performance": spaces_breakdown
        }

    # =========================================================================
    # 3. BOOKING TRENDS & CONVERSION REPORT
    # =========================================================================
    @staticmethod
    def get_booking_report(
        start_date: date = None,
        end_date: date = None,
        user_id: int = None
    ) -> dict:
        """
        Analyzes booking volumes, status distributions, and revenue values.
        """
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        query = Booking.query.filter(
            Booking.created_at >= start_date,
            Booking.created_at <= end_date + timedelta(days=1)
        )
        if user_id:
            query = query.filter_by(user_id=user_id)

        bookings = query.all()
        total_bookings = len(bookings)

        status_counts = {}
        total_booking_value = Decimal("0.00")

        for b in bookings:
            status_counts[b.status] = status_counts.get(b.status, 0) + 1
            if b.status != BookingStatus.CANCELLED:
                total_booking_value += Decimal(b.total_price)

        avg_booking_value = (
            round(Decimal(str(total_booking_value / total_bookings)), 2)
            if total_bookings > 0
            else Decimal("0.00")
        )

        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "summary": {
                "total_bookings_placed": total_bookings,
                "total_gross_booking_value": str(total_booking_value),
                "average_booking_value": str(avg_booking_value)
            },
            "status_distribution": status_counts
        }

    # =========================================================================
    # 4. CAMPAIGN ANALYTICS REPORT
    # =========================================================================
    @staticmethod
    def get_campaign_report(
        start_date: date = None,
        end_date: date = None,
        user_id: int = None
    ) -> dict:
        """
        Analyzes campaign budget allocation, active execution, and status breakdown.
        """
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        query = Campaign.query.filter(
            Campaign.created_at >= start_date,
            Campaign.created_at <= end_date + timedelta(days=1)
        )
        if user_id:
            query = query.filter_by(user_id=user_id)

        campaigns = query.all()
        total_campaigns = len(campaigns)

        status_counts = {}
        total_budget = Decimal("0.00")

        for c in campaigns:
            status_counts[c.status] = status_counts.get(c.status, 0) + 1
            if c.budget:
                total_budget += Decimal(c.budget)

        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "summary": {
                "total_campaigns_created": total_campaigns,
                "total_planned_budget": str(total_budget),
                "active_campaigns_count": status_counts.get(CampaignStatus.ACTIVE, 0)
            },
            "status_distribution": status_counts
        }
