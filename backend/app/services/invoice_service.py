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
        user_id=None,
        campaign_id=None,
        advertiser_id=None,
        status=None,
        search=None,
        min_amount=None,
        max_amount=None,
        due_date_from=None,
        due_date_to=None,
        sort_by="created_at",
        sort_order="desc"
    ):
        """
        Returns paginated invoices with advanced filtering,
        invoice number search, amount thresholds, and whitelisted sorting.
        """
        from sqlalchemy.orm import joinedload

        query = Invoice.query.options(
            joinedload(Invoice.campaign),
            joinedload(Invoice.advertiser)
        )

        if user_id is not None:
            query = query.join(Invoice.campaign).filter(
                db.or_(
                    Invoice.advertiser_id == advertiser_id,
                    Campaign.user_id == user_id
                )
            )
        elif advertiser_id is not None:
            query = query.filter(Invoice.advertiser_id == advertiser_id)

        if campaign_id is not None:
            query = query.filter(Invoice.campaign_id == campaign_id)

        if status:
            query = query.filter(Invoice.status == status)

        if min_amount is not None:
            query = query.filter(Invoice.total_amount >= min_amount)

        if max_amount is not None:
            query = query.filter(Invoice.total_amount <= max_amount)

        if due_date_from is not None:
            query = query.filter(Invoice.due_date >= due_date_from)

        if due_date_to is not None:
            query = query.filter(Invoice.due_date <= due_date_to)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(Invoice.invoice_number.ilike(search_term))

        sort_fields = {
            "created_at": Invoice.created_at,
            "total_amount": Invoice.total_amount,
            "due_date": Invoice.due_date,
            "status": Invoice.status
        }
        sort_column = sort_fields.get(sort_by, Invoice.created_at)
        if str(sort_order).lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        safe_per_page = min(max(1, per_page), 100)
        safe_page = max(1, page)

        return query.paginate(
            page=safe_page,
            per_page=safe_per_page,
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