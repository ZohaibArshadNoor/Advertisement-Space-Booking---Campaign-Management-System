import uuid
from datetime import datetime, timezone

from app.extensions import db


class BookingStatus:
    """
    Defines the lifecycle statuses for a booking.

    PENDING:
        The initial state when a booking request is submitted.
        The requested space is evaluated for availability.

    CONFIRMED:
        The booking is approved, and inventory is officially
        reserved/locked in the availability calendar.

    CANCELLED:
        The booking was rejected, cancelled by user, or expired.
        Any blocked inventory is released.

    COMPLETED:
        The booking execution period has finished successfully.
    """

    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

    ALL = [
        PENDING,
        CONFIRMED,
        CANCELLED,
        COMPLETED
    ]


class Booking(db.Model):
    """
    Represents an advertising inventory booking transaction.

    A booking connects:
    1. An authenticated User (and optional Advertiser organization).
    2. An AdvertisingSpace (inventory asset).
    3. A scheduled date range (start_date to end_date).
    4. Financial total price and workflow status.
    """

    __tablename__ = "bookings"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # Unique human-readable booking reference identifier.
    # Example: BK-9A2F8B1C
    booking_reference = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=lambda: f"BK-{uuid.uuid4().hex[:8].upper()}"
    )

    # Foreign key referencing the user who placed the booking.
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Foreign key referencing the advertiser organization (optional).
    advertiser_id = db.Column(
        db.Integer,
        db.ForeignKey("advertisers.id"),
        nullable=True,
        index=True
    )

    # Foreign key referencing the advertising space being booked.
    space_id = db.Column(
        db.Integer,
        db.ForeignKey("advertising_spaces.id"),
        nullable=False,
        index=True
    )

    # Booking campaign start date.
    start_date = db.Column(
        db.Date,
        nullable=False
    )

    # Booking campaign end date.
    end_date = db.Column(
        db.Date,
        nullable=False
    )

    # Current workflow status.
    status = db.Column(
        db.String(30),
        nullable=False,
        default=BookingStatus.PENDING,
        index=True
    )

    # Calculated monetary value for the booking duration.
    total_price = db.Column(
        db.Numeric(12, 2),
        nullable=False,
        default=0.00
    )

    # Optional internal or client notes.
    notes = db.Column(
        db.Text,
        nullable=True
    )

    # Timestamp when the booking was created.
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # Timestamp when the booking was last updated.
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Foreign key referencing the parent campaign (optional).
    campaign_id = db.Column(
        db.Integer,
        db.ForeignKey("campaigns.id"),
        nullable=True,
        index=True
    )

    # Relationship to User.
    user = db.relationship(
        "User",
        backref=db.backref("bookings", lazy=True)
    )

    # Relationship to Advertiser.
    advertiser = db.relationship(
        "Advertiser",
        backref=db.backref("bookings", lazy=True)
    )

    # Relationship to AdvertisingSpace.
    space = db.relationship(
        "AdvertisingSpace",
        backref=db.backref("bookings", lazy=True)
    )

    # Relationship to parent Campaign.
    campaign = db.relationship(
        "Campaign",
        back_populates="bookings"
    )

    def __repr__(self):
        return (
            f"<Booking {self.booking_reference} "
            f"status={self.status} "
            f"space_id={self.space_id}>"
        )