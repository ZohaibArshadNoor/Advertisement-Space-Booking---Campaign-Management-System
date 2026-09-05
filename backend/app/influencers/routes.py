from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from decimal import Decimal
from datetime import datetime

from app.extensions import db
from app.influencers import influencers_bp
from app.models.influencer import Influencer
from app.models.campaign import Campaign
from app.models.user import User


@influencers_bp.get("/")
def get_influencers():
    """
    List all verified influencers with optional filtering.
    """
    platform = request.args.get("platform")
    niche = request.args.get("niche")
    search = request.args.get("search")
    tier = request.args.get("tier")

    query = Influencer.query.filter_by(is_available=True)

    if platform and platform != "All Platforms":
        query = query.filter(Influencer.platform.ilike(f"%{platform}%"))

    if niche and niche != "All Niches":
        query = query.filter(Influencer.niche.ilike(f"%{niche}%"))

    if tier and tier != "All Tiers":
        query = query.filter_by(tier=tier)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                Influencer.name.ilike(search_term),
                Influencer.handle.ilike(search_term),
                Influencer.niche.ilike(search_term),
                Influencer.bio.ilike(search_term),
            )
        )

    influencers = query.order_by(Influencer.followers_count.desc()).all()
    return jsonify({
        "success": True,
        "count": len(influencers),
        "influencers": [inf.to_dict() for inf in influencers]
    }), 200


@influencers_bp.get("/<int:influencer_id>")
def get_influencer(influencer_id):
    """
    Get detailed media kit for a single influencer.
    """
    influencer = Influencer.query.get_or_404(influencer_id)
    return jsonify({
        "success": True,
        "influencer": influencer.to_dict()
    }), 200


@influencers_bp.post("/hire")
@jwt_required()
def hire_influencer():
    """
    Submit a creator sponsorship proposal / hire request for a campaign.
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    data = request.get_json() or {}
    influencer_id = data.get("influencer_id")
    campaign_id = data.get("campaign_id")
    package_id = data.get("package_id")
    brief_notes = data.get("brief_notes", "")
    target_date = data.get("target_date")

    if not influencer_id or not campaign_id:
        return jsonify({"success": False, "message": "Influencer ID and Campaign ID are required"}), 400

    influencer = Influencer.query.get_or_404(influencer_id)
    campaign = Campaign.query.get_or_404(campaign_id)

    # Find chosen package
    selected_pkg = None
    if influencer.packages:
        for pkg in influencer.packages:
            if pkg.get("id") == package_id:
                selected_pkg = pkg
                break

    if not selected_pkg and influencer.packages:
        selected_pkg = influencer.packages[0]

    pkg_title = selected_pkg.get("title", "Custom Creator Sponsorship") if selected_pkg else "Creator Sponsorship"
    pkg_price = selected_pkg.get("price", 150000) if selected_pkg else 150000

    # In a real system, this updates campaign brief & creator collaboration record
    influencer.completed_campaigns += 1
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Successfully hired {influencer.name} ({influencer.handle}) for campaign '{campaign.name}'.",
        "contract": {
            "influencer_name": influencer.name,
            "influencer_handle": influencer.handle,
            "platform": influencer.platform,
            "campaign_id": campaign.id,
            "campaign_name": campaign.name,
            "package_title": pkg_title,
            "deliverables": selected_pkg.get("deliverables") if selected_pkg else "Sponsored Video & Brand Integration",
            "agreed_fee": str(pkg_price),
            "target_publication_date": target_date,
            "status": "PROPOSAL_ACCEPTED",
            "created_at": datetime.utcnow().isoformat()
        }
    }), 201


@influencers_bp.post("/")
@jwt_required()
def create_influencer():
    """
    Create a new influencer profile (Admin / Space Manager).
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or user.role.name not in ["Administrator", "Space Manager", "Sales Executive"]:
        return jsonify({"success": False, "message": "Unauthorized to add creators"}), 403

    data = request.get_json() or {}
    name = data.get("name")
    handle = data.get("handle")
    platform = data.get("platform", "YouTube")
    niche = data.get("niche", "Tech & Gadgets")

    if not name or not handle:
        return jsonify({"success": False, "message": "Creator name and handle are required"}), 400

    # Ensure handle starts with @
    if not handle.startswith("@"):
        handle = f"@{handle}"

    existing = Influencer.query.filter_by(handle=handle).first()
    if existing:
        return jsonify({"success": False, "message": f"Handle '{handle}' is already registered"}), 400

    influencer = Influencer(
        name=name,
        handle=handle,
        platform=platform,
        niche=niche,
        bio=data.get("bio", ""),
        avatar_url=data.get("avatar_url", ""),
        followers_count=int(data.get("followers_count", 100000)),
        avg_views=int(data.get("avg_views", 25000)),
        engagement_rate=Decimal(str(data.get("engagement_rate", "5.0"))),
        tier=data.get("tier", "Macro Creator"),
        packages=data.get("packages", [
            {
                "id": "pkg_default_1",
                "title": f"Dedicated {platform} Sponsorship",
                "deliverables": "Full dedicated video review & sponsor link",
                "price": 150000
            }
        ]),
        portfolio_links=data.get("portfolio_links", []),
        is_verified=data.get("is_verified", True),
        is_available=data.get("is_available", True),
        rating=Decimal(str(data.get("rating", "4.90")))
    )

    db.session.add(influencer)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Creator {name} registered successfully.",
        "influencer": influencer.to_dict()
    }), 201


@influencers_bp.put("/<int:influencer_id>")
@jwt_required()
def update_influencer(influencer_id):
    """
    Update an existing influencer profile (Admin / Space Manager).
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or user.role.name not in ["Administrator", "Space Manager"]:
        return jsonify({"success": False, "message": "Unauthorized to modify creators"}), 403

    influencer = Influencer.query.get_or_404(influencer_id)
    data = request.get_json() or {}

    if "name" in data:
        influencer.name = data["name"]
    if "handle" in data:
        handle = data["handle"]
        if not handle.startswith("@"):
            handle = f"@{handle}"
        influencer.handle = handle
    if "platform" in data:
        influencer.platform = data["platform"]
    if "niche" in data:
        influencer.niche = data["niche"]
    if "bio" in data:
        influencer.bio = data["bio"]
    if "avatar_url" in data:
        influencer.avatar_url = data["avatar_url"]
    if "followers_count" in data:
        influencer.followers_count = int(data["followers_count"])
    if "avg_views" in data:
        influencer.avg_views = int(data["avg_views"])
    if "engagement_rate" in data:
        influencer.engagement_rate = Decimal(str(data["engagement_rate"]))
    if "tier" in data:
        influencer.tier = data["tier"]
    if "packages" in data:
        influencer.packages = data["packages"]
    if "is_verified" in data:
        influencer.is_verified = bool(data["is_verified"])
    if "is_available" in data:
        influencer.is_available = bool(data["is_available"])

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Creator {influencer.name} updated successfully.",
        "influencer": influencer.to_dict()
    }), 200


@influencers_bp.delete("/<int:influencer_id>")
@jwt_required()
def delete_influencer(influencer_id):
    """
    Delete an influencer profile (Admin only).
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or user.role.name != "Administrator":
        return jsonify({"success": False, "message": "Unauthorized to delete creators"}), 403

    influencer = Influencer.query.get_or_404(influencer_id)
    name = influencer.name
    db.session.delete(influencer)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Creator {name} deleted successfully."
    }), 200
