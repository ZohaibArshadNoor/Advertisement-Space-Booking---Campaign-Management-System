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
