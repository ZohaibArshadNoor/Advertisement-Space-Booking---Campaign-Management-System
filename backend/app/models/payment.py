import uuid
from datetime import datetime, timezone
from decimal import Decimal

from app.extensions import db


class InvoiceStatus:
    """
    Defines the lifecycle statuses for an invoice.
    """
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"

    ALL = [
        DRAFT,
        ISSUED,
        PARTIALLY_PAID,
        PAID,
        OVERDUE,
        CANCELLED
    ]


class PaymentStatus:
    """
    Defines the verification status of a payment transaction.
    """
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

    ALL = [
        PENDING,
        COMPLETED,
        FAILED,
        REFUNDED
    ]


class PaymentMethod:
    """
    Supported payment methods.
    """
    BANK_TRANSFER = "BANK_TRANSFER"
    CREDIT_CARD = "CREDIT_CARD"
    CHEQUE = "CHEQUE"
    CASH = "CASH"
    ONLINE = "ONLINE"

    ALL = [
        BANK_TRANSFER,
        CREDIT_CARD,
        CHEQUE,
        CASH,
        ONLINE
    ]


class Invoice(db.Model):
    """
    Represents a financial invoice generated for an advertising campaign.
    """

    __tablename__ = "invoices"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # Unique invoice identifier (e.g., INV-202608-ABCD)
    invoice_number = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=lambda: f"INV-{uuid.uuid4().hex[:8].upper()}"
    )

    # Foreign key to associated Campaign
    campaign_id = db.Column(
        db.Integer,
        db.ForeignKey("campaigns.id"),
        nullable=False,
        index=True
    )

    # Foreign key to Advertiser organization (optional)
    advertiser_id = db.Column(
        db.Integer,
        db.ForeignKey("advertisers.id"),
        nullable=True,
        index=True
    )

    # Financial line item totals
    subtotal = db.Column(
        db.Numeric(14, 2),
        nullable=False,
        default=0.00
    )

    tax = db.Column(
        db.Numeric(14, 2),
        nullable=False,
        default=0.00
    )

    total_amount = db.Column(
        db.Numeric(14, 2),
        nullable=False,
        default=0.00
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default=InvoiceStatus.DRAFT,
        index=True
    )

    due_date = db.Column(
        db.Date,
        nullable=True
    )

    issued_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    campaign = db.relationship(
        "Campaign",
        backref=db.backref("invoices", lazy=True)
    )

    advertiser = db.relationship(
        "Advertiser",
        backref=db.backref("invoices", lazy=True)
    )

    payments = db.relationship(
        "Payment",
        back_populates="invoice",
        cascade="all, delete-orphan",
        lazy=True
    )

    @property
    def amount_paid(self) -> Decimal:
        """
        Calculates total confirmed payments made against this invoice.
        """
        return sum(
            (p.amount for p in self.payments if p.status == PaymentStatus.COMPLETED),
            Decimal("0.00")
        )

    @property
    def balance_due(self) -> Decimal:
        """
        Calculates remaining unpaid balance.
        """
        return max(Decimal("0.00"), Decimal(self.total_amount) - self.amount_paid)

    def __repr__(self):
        return f"<Invoice {self.invoice_number} [{self.status}] Total={self.total_amount}>"


class Payment(db.Model):
    """
    Represents an individual payment transaction applied toward an invoice.
    """

    __tablename__ = "payments"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # Unique payment transaction reference
    payment_reference = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=lambda: f"PAY-{uuid.uuid4().hex[:8].upper()}"
    )

    # Foreign key to target Invoice
    invoice_id = db.Column(
        db.Integer,
        db.ForeignKey("invoices.id"),
        nullable=False,
        index=True
    )

    # Payment amount
    amount = db.Column(
        db.Numeric(14, 2),
        nullable=False
    )

    # Method used for payment
    payment_method = db.Column(
        db.String(50),
        nullable=False,
        default=PaymentMethod.BANK_TRANSFER
    )

    # External transaction reference (e.g. Bank slip number, gateway ID)
    transaction_reference = db.Column(
        db.String(100),
        nullable=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default=PaymentStatus.COMPLETED,
        index=True
    )

    paid_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationship to Invoice
    invoice = db.relationship(
        "Invoice",
        back_populates="payments"
    )

    def __repr__(self):
        return f"<Payment {self.payment_reference} [{self.status}] Amount={self.amount}>"