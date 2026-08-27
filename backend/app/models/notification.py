from datetime import datetime, timezone

from app.extensions import db


class NotificationType:
    """
    Categories of notifications.
    """
    BOOKING = "BOOKING"
    CAMPAIGN = "CAMPAIGN"
    CREATIVE = "CREATIVE"
    INVOICE = "INVOICE"
    PAYMENT = "PAYMENT"
    SYSTEM = "SYSTEM"

    ALL = [
        BOOKING,
        CAMPAIGN,
        CREATIVE,
        INVOICE,
        PAYMENT,
        SYSTEM
    ]


class Notification(db.Model):
    """
    Represents an in-app notification delivered to a specific user.
    """

    __tablename__ = "notifications"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # Recipient user ID
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Category of the notification (BOOKING, CAMPAIGN, INVOICE, PAYMENT, SYSTEM)
    type = db.Column(
        db.String(30),
        nullable=False,
        default=NotificationType.SYSTEM,
        index=True
    )

    # Short title (e.g., "Booking Confirmed")
    title = db.Column(
        db.String(150),
        nullable=False
    )

    # Detailed notification message body
    message = db.Column(
        db.Text,
        nullable=False
    )

    # Optional deep-link URL (e.g., "/bookings/1" or "/invoices/5")
    link = db.Column(
        db.String(255),
        nullable=True
    )

    # Read/Unread flag
    is_read = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
        index=True
    )

    # Timestamp when created
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True
    )

    # Relationship to User
    user = db.relationship(
        "User",
        backref=db.backref("notifications", lazy=True, cascade="all, delete-orphan")
    )

    def __repr__(self):
        return f"<Notification {self.id} user={self.user_id} read={self.is_read}>"