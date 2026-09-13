from datetime import datetime, date
from decimal import Decimal
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.digital_services import digital_services_bp
from app.models.digital_service import DigitalService, DigitalBaseRate, BookedDigitalService
from app.models.campaign import Campaign
from app.models.user import User

# Initial seed data
DEFAULT_BASE_RATES = [
    {
        "platform": "YouTube",
        "category": "Video Advertising",
        "pricing_model": "CPM (Cost Per 1,000 Views)",
        "base_rate_per_unit": Decimal("350.00"),
        "unit_name": "1,000 Views",
        "min_units": 50,
        "icon_name": "Video",
        "desc": "High retention in-stream TrueView & non-skippable bumper ads",
    },
    {
        "platform": "Meta (Instagram & Facebook)",
        "category": "Social & Reels",
        "pricing_model": "CPM (Cost Per 1,000 Impressions)",
        "base_rate_per_unit": Decimal("200.00"),
        "unit_name": "1,000 Impressions",
        "min_units": 100,
        "icon_name": "Share2",
        "desc": "Full-screen 9:16 vertical reels, stories, and feed carousels",
    },
    {
        "platform": "Google Ads",
        "category": "Search & PPC",
        "pricing_model": "CPC (Cost Per Intent Click)",
        "base_rate_per_unit": Decimal("40.00"),
        "unit_name": "Clicks",
        "min_units": 1000,
        "icon_name": "Search",
        "desc": "Top-of-page Google Search keyword capture & GDN banner display",
    },
    {
        "platform": "Programmatic DSP",
        "category": "Programmatic Display",
        "pricing_model": "CPM (Cost Per 1,000 Impressions)",
        "base_rate_per_unit": Decimal("95.00"),
        "unit_name": "1,000 Impressions",
        "min_units": 200,
        "icon_name": "Zap",
        "desc": "Real-time automated auction bidding across 2M+ publisher websites",
    },
    {
        "platform": "TikTok Ads",
        "category": "Social & Reels",
        "pricing_model": "CPM (Cost Per 1,000 Video Plays)",
        "base_rate_per_unit": Decimal("240.00"),
        "unit_name": "1,000 Plays",
        "min_units": 50,
        "icon_name": "Radio",
        "desc": "Native in-feed video ads with trending music and sound-on experience",
    },
]

DEFAULT_SERVICES = [
    {
        "id": "ds_yt_01",
        "title": "YouTube In-Stream & Bumper Video Ads",
        "category": "Video Advertising",
        "platform": "YouTube",
        "tagline": "High-impact skippable & bumper video ads with verified view rates",
        "duration_days": 30,
        "original_price": Decimal("250000.00"),
        "discounted_price": Decimal("200000.00"),
        "discount_percent": 20,
        "discount_label": "20% OFF Launch Promo",
        "discount_type": "promo",
        "estimated_reach": "650,000+ Targeted Video Views",
        "cpm": "Rs. 307 CPM",
        "icon_name": "Video",
        "color_theme": "danger",
        "deliverables": [
            "Skippable TrueView & 6s Bumper Ads",
            "Audience In-Market & Demographic Filters",
            "Direct Click-Through CTA Overlays",
            "Full View-Rate & Conversion Tracking Report",
        ],
        "specs": "16:9 1080p HD, MP4, Max 60s (15s recommended)",
    },
    {
        "id": "ds_goog_02",
        "title": "Google Search Ads & Display Network",
        "category": "Search & PPC",
        "platform": "Google Ads",
        "tagline": "High-intent keyword search campaigns and 2M+ website banner placements",
        "duration_days": 30,
        "original_price": Decimal("180000.00"),
        "discounted_price": Decimal("153000.00"),
        "discount_percent": 15,
        "discount_label": "15% OFF Starter Pack",
        "discount_type": "growth",
        "estimated_reach": "85,000+ High-Intent Clicks & 1.2M Impressions",
        "cpm": "Rs. 1.80 CPC avg",
        "icon_name": "Search",
        "color_theme": "primary",
        "deliverables": [
            "Top 3 Google Search Engine Position Bid Strategy",
            "Keyword Research & Negative Keyword Filtering",
            "Responsive Google Display Banners",
            "Conversion Pixel & Lead Form Tracking",
        ],
        "specs": "Responsive Search Ads (15 Headlines, 4 Descriptions) + HTML5 Banners",
    },
    {
        "id": "ds_meta_03",
        "title": "Meta 9:16 Vertical Reels & Stories Blitz",
        "category": "Social & Reels",
        "platform": "Meta Ads",
        "tagline": "Dominant Instagram & Facebook full-screen reel placements with click-to-WhatsApp/web",
        "duration_days": 14,
        "original_price": Decimal("160000.00"),
        "discounted_price": Decimal("128000.00"),
        "discount_percent": 20,
        "discount_label": "20% OFF Flash Sprint",
        "discount_type": "promo",
        "estimated_reach": "900,000+ Verified Video Impressions",
        "cpm": "Rs. 142 CPM",
        "icon_name": "Share2",
        "color_theme": "info",
        "deliverables": [
            "Instagram Reels & Facebook Stories Placement",
            "Interest, Age, Gender & City Radius Targeting",
            "Interactive Polling Sticker & Swipe-Up URL",
            "Daily Ad Fatigue & Creative Rotation",
        ],
        "specs": "9:16 Vertical Video (1080x1920), MP4, 15-30s",
    },
    {
        "id": "ds_dsp_04",
        "title": "Programmatic CPM Display RTB Network",
        "category": "Programmatic Display",
        "platform": "DSP Network",
        "tagline": "Automated real-time bidding across 2,000,000+ premium publisher sites in Pakistan & Global",
        "duration_days": 30,
        "original_price": Decimal("220000.00"),
        "discounted_price": Decimal("165000.00"),
        "discount_percent": 25,
        "discount_label": "25% OFF RTB Special",
        "discount_type": "bundle",
        "estimated_reach": "2,300,000+ Programmatic Ad Impressions",
        "cpm": "Rs. 72 CPM",
        "icon_name": "Zap",
        "color_theme": "warning",
        "deliverables": [
            "Automated Real-Time Auction Bidding (DSP)",
            "Placement on Dawn, Tribune, Geo, Samaa and 5k+ apps",
            "Hyper-Local Geo-Fencing & IP Targeting",
            "Brand Safety Whitelist & Anti-Fraud Verification",
        ],
        "specs": "IAB Standards: 300x250, 728x90, 300x600, 320x50",
    },
    {
        "id": "ds_omni_05",
        "title": "Full Omnichannel Digital Domination Package",
        "category": "Enterprise Retainers",
        "platform": "Full Omnichannel",
        "tagline": "All-in-one YouTube + Meta + Google Search + Programmatic synchronized campaign flight",
        "duration_days": 60,
        "original_price": Decimal("750000.00"),
        "discounted_price": Decimal("525000.00"),
        "discount_percent": 30,
        "discount_label": "30% OFF Enterprise Bundle",
        "discount_type": "bundle",
        "estimated_reach": "6,000,000+ Cross-Channel Impressions",
        "cpm": "Rs. 87 blended CPM",
        "icon_name": "Sparkles",
        "color_theme": "primary",
        "deliverables": [
            "Synchronized Multi-Platform Flight Management",
            "Cross-Platform Retargeting Pixels & Lookalike Audiences",
            "Weekly A/B Split Testing & Budget Reallocation",
            "Dedicated Performance Marketing Specialist",
            "End-of-Campaign Executive ROI & ROAS Report",
        ],
        "specs": "Multi-asset creative suite provided or adapted",
    },
]


def seed_defaults_if_empty():
    """Ensure baseline digital services and rate cards exist in the database."""
    try:
        if DigitalBaseRate.query.count() == 0:
            for r in DEFAULT_BASE_RATES:
                rate = DigitalBaseRate(
                    platform=r["platform"],
                    category=r["category"],
                    pricing_model=r["pricing_model"],
                    base_rate_per_unit=r["base_rate_per_unit"],
                    unit_name=r["unit_name"],
                    min_units=r["min_units"],
                    icon_name=r["icon_name"],
                    desc=r["desc"],
                )
                db.session.add(rate)
            db.session.commit()

        if DigitalService.query.count() == 0:
            for s in DEFAULT_SERVICES:
                srv = DigitalService(
                    id=s["id"],
                    title=s["title"],
                    category=s["category"],
                    platform=s["platform"],
                    tagline=s["tagline"],
                    duration_days=s["duration_days"],
                    original_price=s["original_price"],
                    discounted_price=s["discounted_price"],
                    discount_percent=s["discount_percent"],
                    discount_label=s["discount_label"],
                    discount_type=s["discount_type"],
                    estimated_reach=s["estimated_reach"],
                    cpm=s["cpm"],
                    icon_name=s["icon_name"],
                    color_theme=s["color_theme"],
                    deliverables=s["deliverables"],
                    specs=s.get("specs"),
                    is_active=True,
                )
                db.session.add(srv)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error seeding digital services: {e}")


# --------------------------------------------------------------------------
# 1. CATALOG ROUTES
# --------------------------------------------------------------------------

@digital_services_bp.get("/catalog")
def get_catalog():
    seed_defaults_if_empty()
    services = DigitalService.query.filter_by(is_active=True).order_by(DigitalService.created_at.desc()).all()
    return jsonify({
        "success": True,
        "services": [srv.to_dict() for srv in services]
    }), 200


@digital_services_bp.post("/catalog")
def create_service():
    data = request.get_json() or {}
    title = data.get("title")
    platform = data.get("platform")
    category = data.get("category")
    
    if not title or not platform or not category:
        return jsonify({"success": False, "message": "Missing required fields (title, platform, category)"}), 400

    new_id = data.get("id") or f"ds_{int(datetime.utcnow().timestamp())}"
    
    srv = DigitalService(
        id=new_id,
        title=title,
        category=category,
        platform=platform,
        tagline=data.get("tagline"),
        duration_days=int(data.get("durationDays") or 30),
        original_price=Decimal(str(data.get("originalPrice") or 0)),
        discounted_price=Decimal(str(data.get("discountedPrice") or data.get("originalPrice") or 0)),
        discount_percent=int(data.get("discountPercent") or 0),
        discount_label=data.get("discountLabel"),
        discount_type=data.get("discountType") or "promo",
        estimated_reach=data.get("estimatedReach"),
        cpm=data.get("cpm"),
        icon_name=data.get("iconName") or "Video",
        color_theme=data.get("colorTheme") or "primary",
        deliverables=data.get("deliverables") or [],
        specs=data.get("specs"),
        is_active=True,
    )
    db.session.add(srv)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Digital service '{srv.title}' created successfully.",
        "service": srv.to_dict()
    }), 201


@digital_services_bp.delete("/catalog/<string:service_id>")
def delete_service(service_id):
    srv = DigitalService.query.get_or_404(service_id)
    db.session.delete(srv)
    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Digital service '{srv.title}' removed from catalog."
    }), 200


# --------------------------------------------------------------------------
# 2. BASE RATES ROUTES
# --------------------------------------------------------------------------

@digital_services_bp.get("/base-rates")
def get_base_rates():
    seed_defaults_if_empty()
    rates = DigitalBaseRate.query.all()
    return jsonify({
        "success": True,
        "baseRates": [r.to_dict() for r in rates]
    }), 200


@digital_services_bp.post("/base-rates")
def add_base_rate():
    data = request.get_json() or {}
    platform = data.get("platform")
    if not platform:
        return jsonify({"success": False, "message": "Platform name is required"}), 400

    existing = DigitalBaseRate.query.get(platform)
    if existing:
        return jsonify({"success": False, "message": f"Platform '{platform}' already exists."}), 400

    rate = DigitalBaseRate(
        platform=platform,
        category=data.get("category", "Video & OTT Ads"),
        pricing_model=data.get("pricingModel", "CPM"),
        base_rate_per_unit=Decimal(str(data.get("baseRatePerUnit") or 150)),
        unit_name=data.get("unitName", "1,000 Impressions"),
        min_units=int(data.get("minUnits") or 50),
        icon_name=data.get("iconName", "Globe"),
        desc=data.get("desc", ""),
    )
    db.session.add(rate)
    db.session.commit()

    all_rates = DigitalBaseRate.query.all()
    return jsonify({
        "success": True,
        "message": f"New platform service '{platform}' added successfully.",
        "baseRates": [r.to_dict() for r in all_rates]
    }), 201


@digital_services_bp.put("/base-rates/<string:platform>")
def update_base_rate(platform):
    rate = DigitalBaseRate.query.get_or_404(platform)
    data = request.get_json() or {}

    if "category" in data:
        rate.category = data["category"]
    if "pricingModel" in data:
        rate.pricing_model = data["pricingModel"]
    if "baseRatePerUnit" in data:
        rate.base_rate_per_unit = Decimal(str(data["baseRatePerUnit"]))
    if "unitName" in data:
        rate.unit_name = data["unitName"]
    if "minUnits" in data:
        rate.min_units = int(data["minUnits"])
    if "desc" in data:
        rate.desc = data["desc"]

    db.session.commit()
    all_rates = DigitalBaseRate.query.all()
    return jsonify({
        "success": True,
        "message": f"Base rate for '{platform}' updated successfully.",
        "baseRates": [r.to_dict() for r in all_rates]
    }), 200


@digital_services_bp.delete("/base-rates/<string:platform>")
def delete_base_rate(platform):
    rate = DigitalBaseRate.query.get_or_404(platform)
    db.session.delete(rate)
    db.session.commit()
    all_rates = DigitalBaseRate.query.all()
    return jsonify({
        "success": True,
        "message": f"Platform base rate '{platform}' removed.",
        "baseRates": [r.to_dict() for r in all_rates]
    }), 200


@digital_services_bp.post("/base-rates/reset")
def reset_base_rates():
    DigitalBaseRate.query.delete()
    for r in DEFAULT_BASE_RATES:
        rate = DigitalBaseRate(
            platform=r["platform"],
            category=r["category"],
            pricing_model=r["pricing_model"],
            base_rate_per_unit=r["base_rate_per_unit"],
            unit_name=r["unit_name"],
            min_units=r["min_units"],
            icon_name=r["icon_name"],
            desc=r["desc"],
        )
        db.session.add(rate)
    db.session.commit()
    all_rates = DigitalBaseRate.query.all()
    return jsonify({
        "success": True,
        "message": "Base rates reset to system defaults.",
        "baseRates": [r.to_dict() for r in all_rates]
    }), 200


# --------------------------------------------------------------------------
# 3. BOOKED DIGITAL SERVICES (DEPLOYMENTS / REQUESTS)
# --------------------------------------------------------------------------

@digital_services_bp.get("/bookings")
def get_bookings():
    campaign_id = request.args.get("campaign_id")
    query = BookedDigitalService.query
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    bookings = query.order_by(BookedDigitalService.created_at.desc()).all()
    return jsonify({
        "success": True,
        "services": [b.to_dict() for b in bookings]
    }), 200


@digital_services_bp.post("/bookings")
def book_service():
    data = request.get_json() or {}
    booking_id = data.get("id") or f"DGB-{int(datetime.utcnow().timestamp())}"
    
    start_d = None
    if data.get("start_date"):
        try:
            start_d = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        except Exception:
            pass

    end_d = None
    if data.get("end_date"):
        try:
            end_d = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
        except Exception:
            pass

    booking = BookedDigitalService(
        id=booking_id,
        campaign_id=data.get("campaign_id") if data.get("campaign_id") != "STANDALONE" else None,
        campaign_name=data.get("campaign_name"),
        service_id=data.get("service_id"),
        service_title=data.get("service_title", "Digital Package"),
        platform=data.get("platform", "Digital Channel"),
        category=data.get("category"),
        original_price=Decimal(str(data.get("original_price") or 0)),
        agreed_price=Decimal(str(data.get("agreed_price") or 0)),
        discount_applied=data.get("discount_applied", "Standard Rate"),
        duration_days=int(data.get("duration_days") or 30),
        start_date=start_d,
        end_date=end_d,
        is_standalone=bool(data.get("is_standalone")),
        status=data.get("status") or "PENDING",
        requester_name=data.get("requester_name", "Advertiser"),
    )
    db.session.add(booking)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Successfully registered digital service booking '{booking.service_title}'.",
        "service": booking.to_dict()
    }), 201


@digital_services_bp.patch("/bookings/<string:booking_id>/status")
def update_booking_status(booking_id):
    booking = BookedDigitalService.query.get_or_404(booking_id)
    data = request.get_json() or {}
    new_status = data.get("status")
    if not new_status:
        return jsonify({"success": False, "message": "Status is required"}), 400

    booking.status = new_status
    booking.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Digital service status successfully updated to '{new_status}'.",
        "service": booking.to_dict()
    }), 200


@digital_services_bp.delete("/bookings/<string:booking_id>")
def delete_booking(booking_id):
    booking = BookedDigitalService.query.get_or_404(booking_id)
    db.session.delete(booking)
    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Digital service reservation cancelled."
    }), 200
