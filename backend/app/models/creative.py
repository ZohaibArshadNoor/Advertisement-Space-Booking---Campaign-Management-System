import uuid
from datetime import datetime, timezone

from app.extensions import db


class MediaStatus:
    """
    Approval statuses for advertising creative assets.
    """
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

    ALL = [
        PENDING,
        APPROVED,
        REJECTED
    ]


CreativeStatus = MediaStatus


class Creative(db.Model):
    """
    Represents an advertising creative/media asset uploaded for a campaign.
    """

    __tablename__ = "creatives"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # Unique public media asset reference (e.g. MED-8A2F1B9C)
    media_reference = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        default=lambda: f"MED-{uuid.uuid4().hex[:8].upper()}"
    )

    # Foreign key referencing the parent Campaign
    campaign_id = db.Column(
        db.Integer,
        db.ForeignKey("campaigns.id"),
        nullable=False,
        index=True
    )

    # Foreign key referencing the user who uploaded the asset
    uploaded_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Unique on-disk stored filename (prevents collision & directory traversal)
    filename = db.Column(
        db.String(255),
        nullable=False
    )

    # Original filename as uploaded by client (e.g. "summer_billboard_hd.png")
    original_filename = db.Column(
        db.String(255),
        nullable=False
    )

    # Relative path on disk
    file_path = db.Column(
        db.String(500),
        nullable=False
    )

    # MIME Type (e.g. "image/png", "video/mp4", "application/pdf")
    file_type = db.Column(
        db.String(100),
        nullable=False
    )

    # File size in bytes
    file_size = db.Column(
        db.BigInteger,
        nullable=False
    )

    # Optional dimensions (e.g. "1920x1080", "1200x600")
    dimensions = db.Column(
        db.String(50),
        nullable=True
    )

    # Verification workflow status (PENDING -> APPROVED / REJECTED)
    status = db.Column(
        db.String(30),
        nullable=False,
        default=MediaStatus.PENDING,
        index=True
    )

    # Review feedback if rejected
    rejection_reason = db.Column(
        db.Text,
        nullable=True
    )

    # Staff reviewer identity
    reviewed_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    # Review timestamp
    reviewed_at = db.Column(
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
        backref=db.backref("creatives", lazy=True, cascade="all, delete-orphan")
    )

    uploader = db.relationship(
        "User",
        foreign_keys=[uploaded_by],
        backref=db.backref("uploaded_creatives", lazy=True)
    )

    reviewer = db.relationship(
        "User",
        foreign_keys=[reviewed_by],
        backref=db.backref("reviewed_creatives", lazy=True)
    )

    def __repr__(self):
        return f"<Creative {self.media_reference} file='{self.original_filename}' status={self.status}>"


# Alias for cross-compatibility
MediaAsset = Creative