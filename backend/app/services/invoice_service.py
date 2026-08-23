from datetime import date, datetime, timezone
from decimal import Decimal

from app.extensions import db
from app.models.campaign import Campaign
from app.models.payment import Invoice, InvoiceStatus, PaymentStatus


class InvoiceService:
    """
    Handles business logic for invoicing, tax calculations,
    and payment reconciliation.
    """

    @staticmethod
    def get_by_id(invoice_id: int):
        return db.session.get(Invoice, invoice_id)

    @staticmethod
    def get_by_number(invoice_number: str):
        return Invoice.query.filter_by(
            invoice_number=invoice_number
        ).first()

    @staticmethod
    def get_all(
        page=1,
        per_page=10,
        campaign_id=None,
        advertiser_id=None,
        status=None
    ):
        query = Invoice.query

        if campaign_id is not None:
            query = query.filter(Invoice.campaign_id == campaign_id)

        if advertiser_id is not None:
            query = query.filter(Invoice.advertiser_id == advertiser_id)

        if status:
            query = query.filter(Invoice.status == status)

        return query.order_by(
            Invoice.created_at.desc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

    @staticmethod
    def create_for_campaign(
        campaign_id: int,
        tax_rate: Decimal = Decimal("0.00"),
        due_date: date = None,
        advertiser_id: int = None
    ):
        """
        Creates an invoice automatically calculated from confirmed bookings
        attached to the campaign.
        """
        campaign = db.session.get(Campaign, campaign_id)
        if not campaign:
            return None, "Campaign not found."

        # Compute subtotal from campaign bookings
        subtotal = sum(
            (Decimal(b.total_price) for b in campaign.bookings if b.status != "CANCELLED"),
            Decimal("0.00")
        )

        tax_amount = subtotal * (Decimal(tax_rate) / Decimal("100.00"))
        total_amount = subtotal + tax_amount

        invoice = Invoice(
            campaign_id=campaign.id,
            advertiser_id=advertiser_id or campaign.advertiser_id,
            subtotal=subtotal,
            tax=tax_amount,
            total_amount=total_amount,
            status=InvoiceStatus.ISSUED,
            due_date=due_date,
            issued_at=datetime.now(timezone.utc)
        )

        db.session.add(invoice)
        db.session.commit()

        return invoice, None

    @staticmethod
    def update_status(invoice: Invoice, new_status: str):
        """
        Manually updates the invoice status.
        """
        if new_status not in InvoiceStatus.ALL:
            return None, f"Invalid status. Must be one of {InvoiceStatus.ALL}"

        invoice.status = new_status
        db.session.commit()
        return invoice, None

    @staticmethod
    def reconcile_status(invoice: Invoice):
        """
        Automatically recalculates and updates invoice status
        based on total completed payments.
        """
        if invoice.status == InvoiceStatus.CANCELLED:
            return invoice

        paid = invoice.amount_paid
        total = Decimal(invoice.total_amount)

        if paid >= total and total > Decimal("0.00"):
            invoice.status = InvoiceStatus.PAID
        elif paid > Decimal("0.00"):
            invoice.status = InvoiceStatus.PARTIALLY_PAID
        else:
            invoice.status = InvoiceStatus.ISSUED

        db.session.commit()
        return invoice