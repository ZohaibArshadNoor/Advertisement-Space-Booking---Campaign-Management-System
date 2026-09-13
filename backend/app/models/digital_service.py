from datetime import datetime
from decimal import Decimal
from app.extensions import db


class DigitalService(db.Model):
    """
    Pre-built digital marketing package catalog (YouTube, Meta, Google Ads, Programmatic, etc.)
    """
    __tablename__ = "digital_services"

    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    platform = db.Column(db.String(100), nullable=False)
    tagline = db.Column(db.String(255), nullable=True)
    duration_days = db.Column(db.Integer, default=30)
    original_price = db.Column(db.Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    discounted_price = db.Column(db.Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    discount_percent = db.Column(db.Integer, default=0)
    discount_label = db.Column(db.String(100), nullable=True)
    discount_type = db.Column(db.String(50), default="promo")
    estimated_reach = db.Column(db.String(150), nullable=True)
    cpm = db.Column(db.String(50), nullable=True)
    icon_name = db.Column(db.String(50), default="Video")
    color_theme = db.Column(db.String(50), default="primary")
    deliverables = db.Column(db.JSON, nullable=True)
    specs = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "platform": self.platform,
            "tagline": self.tagline,
            "durationDays": self.duration_days,
            "originalPrice": float(self.original_price) if self.original_price is not None else 0.0,
            "discountedPrice": float(self.discounted_price) if self.discounted_price is not None else 0.0,
            "discountPercent": self.discount_percent,
            "discountLabel": self.discount_label,
            "discountType": self.discount_type,
            "estimatedReach": self.estimated_reach,
            "cpm": self.cpm,
            "iconName": self.icon_name,
            "colorTheme": self.color_theme,
            "deliverables": self.deliverables or [],
            "specs": self.specs,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class DigitalBaseRate(db.Model):
    """
    Standard platform base rate cards for custom digital advertising computations.
    """
    __tablename__ = "digital_base_rates"

    platform = db.Column(db.String(100), primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    pricing_model = db.Column(db.String(100), default="CPM")
    base_rate_per_unit = db.Column(db.Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    unit_name = db.Column(db.String(100), default="1,000 Views")
    min_units = db.Column(db.Integer, default=50)
    icon_name = db.Column(db.String(50), default="Globe")
    desc = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "platform": self.platform,
            "category": self.category,
            "pricingModel": self.pricing_model,
            "baseRatePerUnit": float(self.base_rate_per_unit) if self.base_rate_per_unit is not None else 0.0,
            "unitName": self.unit_name,
            "minUnits": self.min_units,
            "iconName": self.icon_name,
            "desc": self.desc,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class BookedDigitalService(db.Model):
    """
    Digital service deployments & reservations booked by advertisers or linked to campaigns.
    """
    __tablename__ = "booked_digital_services"

    id = db.Column(db.String(50), primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    campaign_name = db.Column(db.String(200), nullable=True)
    service_id = db.Column(db.String(50), nullable=True)
    service_title = db.Column(db.String(200), nullable=False)
    platform = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=True)
    original_price = db.Column(db.Numeric(12, 2), default=Decimal("0.00"))
    agreed_price = db.Column(db.Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    discount_applied = db.Column(db.String(100), nullable=True)
    duration_days = db.Column(db.Integer, default=30)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    is_standalone = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(50), default="PENDING")
    requester_name = db.Column(db.String(120), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "campaign_name": self.campaign_name,
            "service_id": self.service_id,
            "service_title": self.service_title,
            "platform": self.platform,
            "category": self.category,
            "original_price": float(self.original_price) if self.original_price is not None else 0.0,
            "agreed_price": float(self.agreed_price) if self.agreed_price is not None else 0.0,
            "discount_applied": self.discount_applied,
            "duration_days": self.duration_days,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_standalone": self.is_standalone,
            "status": self.status,
            "requester_name": self.requester_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
