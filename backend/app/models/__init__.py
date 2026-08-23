"""
Database models for the Advertisement Booking system.

Importing the models here ensures that SQLAlchemy knows about
them when Flask-Migrate examines the application's metadata.
"""

from app.models.role import Role
from app.models.user import User
from app.models.space import (
    SpaceCategory,
    Location,
    AdvertisingSpace,
    RateCard,
    SpaceAvailability
)
from app.models.advertiser import (
    Advertiser,
    AdvertiserContact
)
from app.models.booking import (
    Booking,
    BookingStatus
)
from app.models.campaign import (
    Campaign,
    CampaignStatus
)
from app.models.payment import (
    Invoice,
    InvoiceStatus,
    Payment,
    PaymentStatus,
    PaymentMethod    
)
from app.models.notification import (
    Notification,
    NotificationType 
)
from app.models.audit import (
    AuditLog,
    AuditAction
)
from app.models.creative import (
    Creative,
    MediaAsset,
    MediaStatus
)

__all__ = [
    "Role",
    "User",
    "SpaceCategory",
    "Location",
    "AdvertisingSpace",
    "RateCard",
    "SpaceAvailability",
    "Advertiser",
    "AdvertiserContact",
    "Booking",
    "BookingStatus",
    "Campaign",
    "CampaignStatus",
    "Invoice",
    "InvoiceStatus",
    "Payment",
    "PaymentStatus",
    "PaymentMethod",
    "Notification",
    "NotificationType",
    "AuditLog",
    "AuditAction",
    "Creative",
    "MediaAsset",
    "MediaStatus"
]