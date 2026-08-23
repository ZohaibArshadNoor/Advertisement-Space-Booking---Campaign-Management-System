from datetime import datetime, timezone
from decimal import Decimal

from app.extensions import db
from app.models.payment import Invoice, InvoiceStatus, Payment, PaymentMethod, PaymentStatus
from app.services.invoice_service import InvoiceService


class PaymentService:
    """
    Handles payment transaction recording, validation,
    and automatic invoice reconciliation.
    """

    @staticmethod
    def get_by_id(payment_id: int):
        return db.session.get(Payment, payment_id)

    @staticmethod
    def get_all(page=1, per_page=10, invoice_id=None, status=None):
        query = Payment.query

        if invoice_id is not None:
            query = query.filter(Payment.invoice_id == invoice_id)

        if status:
            query = query.filter(Payment.status == status)

        return query.order_by(
            Payment.created_at.desc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

    @staticmethod
    def record_payment(
        invoice_id: int,
        amount: Decimal,
        payment_method: str = PaymentMethod.BANK_TRANSFER,
        transaction_reference: str = None
    ):
        """
        Records a new payment against an invoice and updates invoice status.
        """
        invoice = db.session.get(Invoice, invoice_id)
        if not invoice:
            return None, "Invoice not found."

        if invoice.status == InvoiceStatus.CANCELLED:
            return None, "Cannot record payment on a cancelled invoice."

        if invoice.status == InvoiceStatus.PAID:
            return None, "This invoice is already fully paid."

        amount_dec = Decimal(str(amount))
        if amount_dec <= Decimal("0.00"):
            return None, "Payment amount must be greater than zero."

        payment = Payment(
            invoice_id=invoice.id,
            amount=amount_dec,
            payment_method=payment_method,
            transaction_reference=transaction_reference,
            status=PaymentStatus.COMPLETED,
            paid_at=datetime.now(timezone.utc)
        )

        db.session.add(payment)
        db.session.commit()

        # Reconcile parent invoice status
        InvoiceService.reconcile_status(invoice)

        return payment, None

    @staticmethod
    def update_status(payment: Payment, new_status: str):
        """
        Updates payment status (e.g. COMPLETED -> REFUNDED)
        and re-evaluates the invoice balance.
        """
        if new_status not in PaymentStatus.ALL:
            return None, f"Invalid status. Must be one of {PaymentStatus.ALL}"

        payment.status = new_status
        db.session.commit()

        # Reconcile parent invoice status after payment change
        InvoiceService.reconcile_status(payment.invoice)

        return payment, None