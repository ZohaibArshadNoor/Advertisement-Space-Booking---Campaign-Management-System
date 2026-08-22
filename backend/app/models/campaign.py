import uuid
from datetime import datetime, timezone

from app.extensions import db


class CampaignStatus:
    """
    Defines the lifecycle statuses for an advertising campaign.

    DRAFT:
        Initial state when a campaign is planned. Bookings can be attached.

    ACTIVE:
        The campaign is currently live and executing across its booked spaces.

    PAUSED:
        The campaign is temporarily paused.

    COMPLETED:
        The campaign duration has ended and all bookings are finished.

    CANCELLED:
        The campaign was cancelled before or during execution.
    """

    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

    ALL = [
        DRAFT,
        ACTIVE,
        PAUSED,
        COMPLETED,
        CANCELLED
    ]


class Campaign(db.Model):
    """
    Represents a high-level advertising campaign.

    An advertising campaign groups one or more advertising space bookings,
    creative materials, quotations, and performance reports under a single
    strategic objective.
    """

    __tablename__ = "campaigns"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # Unique human-readable campaign reference identifier.
    # Example: CMP-9A2F8B1C
    campaign_reference = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=lambda: f"CMP-{uuid.uuid4().hex[:8].upper()}"
    )

    # Foreign key referencing the user who owns/created the campaign.
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

    # Campaign title / name.
    name = db.Column(
        db.String(255),
        nullable=False
    )

    # Detailed campaign description or strategic goal.
    description = db.Column(
        db.Text,
        nullable=True
    )

    # Campaign workflow status.
    status = db.Column(
        db.String(50),
        nullable=False,
        default=CampaignStatus.DRAFT,
        index=True
    )

    # Overall planned start date for the campaign.
    start_date = db.Column(
        db.Date,
        nullable=True
    )

    # Overall planned end date for the campaign.
    end_date = db.Column(
        db.Date,
        nullable=True
    )

    # Optional planned financial budget.
    budget = db.Column(
        db.Numeric(14, 2),
        nullable=True
    )

    # Timestamp when the campaign was created.
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # Timestamp when the campaign was last updated.
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationship to User.
    user = db.relationship(
        "User",
        backref=db.backref("campaigns", lazy=True)
    )

    # Relationship to Advertiser.
    advertiser = db.relationship(
        "Advertiser",
        backref=db.backref("campaigns", lazy=True)
    )

    # Relationship to Bookings (One campaign can contain multiple bookings).
    bookings = db.relationship(
        "Booking",
        back_populates="campaign",
        cascade="all, delete-orphan",
        lazy=True
    )

    def __repr__(self):
        return (
            f"<Campaign {self.campaign_reference} "
            f"name='{self.name}' "
            f"status={self.status}>"
        )