from datetime import datetime
from decimal import Decimal
from app.extensions import db


class Influencer(db.Model):
    """
    Influencer and content creator profile managed by the digital agency.
    """
    __tablename__ = "influencers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    handle = db.Column(db.String(100), nullable=False, unique=True)
    platform = db.Column(db.String(50), nullable=False)  # YouTube, Instagram, TikTok, LinkedIn
    niche = db.Column(db.String(100), nullable=False)    # Tech & Gadgets, Fashion & Lifestyle, Food & Vlogging, Gaming, Business
    bio = db.Column(db.Text, nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    
    # Audience Metrics
    followers_count = db.Column(db.Integer, default=0)
    avg_views = db.Column(db.Integer, default=0)
    engagement_rate = db.Column(db.Numeric(5, 2), default=Decimal("0.00"))  # e.g., 6.85%
    tier = db.Column(db.String(50), default="Macro Creator")               # Nano, Micro, Macro, Celebrity
    
    # Pricing & Deliverable Packages (stored as JSON)
    packages = db.Column(db.JSON, nullable=True)
    # Sample past campaigns / portfolio links
    portfolio_links = db.Column(db.JSON, nullable=True)

    is_verified = db.Column(db.Boolean, default=True)
    is_available = db.Column(db.Boolean, default=True)
    rating = db.Column(db.Numeric(3, 2), default=Decimal("4.9"))
    completed_campaigns = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "handle": self.handle,
            "platform": self.platform,
            "niche": self.niche,
            "bio": self.bio,
            "avatar_url": self.avatar_url,
            "followers_count": self.followers_count,
            "avg_views": self.avg_views,
            "engagement_rate": float(self.engagement_rate) if self.engagement_rate else 0.0,
            "tier": self.tier,
            "packages": self.packages or [],
            "portfolio_links": self.portfolio_links or [],
            "is_verified": self.is_verified,
            "is_available": self.is_available,
            "rating": float(self.rating) if self.rating else 5.0,
            "completed_campaigns": self.completed_campaigns,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class HiredInfluencer(db.Model):
    """
    Contract record for an influencer hired/booked for a campaign or brand activation.
    """
    __tablename__ = "hired_influencers"

    id = db.Column(db.String(64), primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    campaign_name = db.Column(db.String(200), nullable=True)
    influencer_id = db.Column(db.Integer, db.ForeignKey("influencers.id", ondelete="CASCADE"), nullable=False)
    influencer_name = db.Column(db.String(120), nullable=False)
    influencer_handle = db.Column(db.String(100), nullable=False)
    platform = db.Column(db.String(50), nullable=False)
    avatar_url = db.Column(db.String(255), nullable=True)
    package_title = db.Column(db.String(150), nullable=True)
    deliverables = db.Column(db.Text, nullable=True)
    agreed_fee = db.Column(db.Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    target_date = db.Column(db.String(50), nullable=True)
    brief_notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default="PENDING_ACCEPTANCE")  # PENDING_ACCEPTANCE, IN_PRODUCTION, SUBMITTED_FOR_REVIEW, REVISION_REQUESTED, COMPLETED, DECLINED, CANCELLED
    submission_url = db.Column(db.String(500), nullable=True)
    submission_notes = db.Column(db.Text, nullable=True)
    submitted_at = db.Column(db.DateTime, nullable=True)
    revision_notes = db.Column(db.Text, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "campaign_name": self.campaign_name,
            "influencer_id": self.influencer_id,
            "influencer_name": self.influencer_name,
            "influencer_handle": self.influencer_handle,
            "platform": self.platform,
            "avatar_url": self.avatar_url,
            "package_title": self.package_title,
            "deliverables": self.deliverables,
            "agreed_fee": float(self.agreed_fee) if self.agreed_fee is not None else 0.0,
            "target_date": self.target_date,
            "brief_notes": self.brief_notes,
            "status": self.status,
            "submission_url": self.submission_url,
            "submission_notes": self.submission_notes,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "revision_notes": self.revision_notes,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

