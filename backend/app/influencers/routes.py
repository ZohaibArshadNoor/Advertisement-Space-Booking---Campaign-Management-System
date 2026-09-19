from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from decimal import Decimal
from datetime import datetime

from app.extensions import db
from app.influencers import influencers_bp
from app.models.influencer import Influencer, HiredInfluencer
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


@influencers_bp.get("/hired")
def get_all_hired_influencers():
    """
    List all hired influencer contracts with optional campaign filtering.
    """
    campaign_id = request.args.get("campaign_id")
    query = HiredInfluencer.query
    if campaign_id:
        try:
            cid = int(campaign_id)
            query = query.filter_by(campaign_id=cid)
        except ValueError:
            pass

    hired = query.order_by(HiredInfluencer.created_at.desc()).all()
    return jsonify({
        "success": True,
        "count": len(hired),
        "hired": [h.to_dict() for h in hired]
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
def hire_influencer():
    """
    Submit a creator sponsorship proposal / hire request for a campaign and save to database.
    """
    data = request.get_json() or {}
    influencer_id = data.get("influencer_id")
    campaign_id = data.get("campaign_id")
    package_id = data.get("package_id")
    brief_notes = data.get("brief_notes", "")
    target_date = data.get("target_date")

    if not influencer_id:
        return jsonify({"success": False, "message": "Influencer ID is required"}), 400

    influencer = Influencer.query.get_or_404(influencer_id)
    campaign = None
    if campaign_id:
        try:
            campaign = Campaign.query.get(int(campaign_id))
        except (ValueError, TypeError):
            campaign = None

    # Find chosen package
    selected_pkg = None
    if influencer.packages:
        for pkg in influencer.packages:
            if pkg.get("id") == package_id:
                selected_pkg = pkg
                break

    if not selected_pkg and influencer.packages:
        selected_pkg = influencer.packages[0]

    pkg_title = data.get("package_title") or (selected_pkg.get("title") if selected_pkg else "Creator Sponsorship")
    pkg_price = data.get("agreed_fee") or (selected_pkg.get("price") if selected_pkg else 150000)
    deliverables = data.get("deliverables") or (selected_pkg.get("deliverables") if selected_pkg else "Sponsored Video & Brand Integration")

    # Increment influencer stats
    influencer.completed_campaigns = (influencer.completed_campaigns or 0) + 1

    # Unique hire contract ID
    contract_id = f"HIRE-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{influencer.id}"
    
    hired_record = HiredInfluencer(
        id=contract_id,
        campaign_id=campaign.id if campaign else None,
        campaign_name=campaign.name if campaign else data.get("campaign_name", "Direct Sponsorship"),
        influencer_id=influencer.id,
        influencer_name=influencer.name,
        influencer_handle=influencer.handle,
        platform=influencer.platform,
        avatar_url=influencer.avatar_url or "",
        package_title=pkg_title,
        deliverables=deliverables,
        agreed_fee=Decimal(str(pkg_price)),
        target_date=target_date or "",
        brief_notes=brief_notes,
        status="PENDING_ACCEPTANCE"
    )
    db.session.add(hired_record)

    # If linked to campaign, also sync into campaign performance metrics
    if campaign:
        metrics = dict(campaign.performance_metrics or {})
        hired_creators = list(metrics.get("hired_creators", []))
        hired_creators.append(hired_record.to_dict())
        metrics["hired_creators"] = hired_creators
        metrics["influencer_spend"] = sum(float(c.get("agreed_fee", 0)) for c in hired_creators)
        campaign.performance_metrics = metrics

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Successfully hired {influencer.name} ({influencer.handle}).",
        "contract": hired_record.to_dict()
    }), 201


@influencers_bp.post("/hired/<string:hire_id>/accept")
def accept_hired_proposal(hire_id):
    """
    Influencer accepts the sponsorship proposal; moving contract to IN_PRODUCTION.
    """
    hire = HiredInfluencer.query.get_or_404(hire_id)
    hire.status = "IN_PRODUCTION"
    hire.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Proposal accepted! Contract {hire.id} is now in production.",
        "contract": hire.to_dict()
    }), 200


@influencers_bp.post("/hired/<string:hire_id>/decline")
def decline_hired_proposal(hire_id):
    """
    Influencer declines the sponsorship proposal.
    """
    hire = HiredInfluencer.query.get_or_404(hire_id)
    hire.status = "DECLINED"
    hire.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Proposal {hire.id} declined.",
        "contract": hire.to_dict()
    }), 200


@influencers_bp.post("/hired/<string:hire_id>/submit-deliverable")
def submit_contract_deliverable(hire_id):
    """
    Influencer submits creative deliverable URL and proof notes for advertiser review.
    """
    hire = HiredInfluencer.query.get_or_404(hire_id)
    data = request.get_json() or {}
    submission_url = data.get("submission_url", "").strip()
    submission_notes = data.get("submission_notes", "").strip()

    if not submission_url:
        return jsonify({"success": False, "message": "Content / live post URL is required."}), 400

    hire.submission_url = submission_url
    hire.submission_notes = submission_notes
    hire.submitted_at = datetime.utcnow()
    hire.status = "SUBMITTED_FOR_REVIEW"
    hire.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Creative deliverables submitted successfully for advertiser review.",
        "contract": hire.to_dict()
    }), 200


@influencers_bp.post("/hired/<string:hire_id>/approve")
def approve_contract_deliverable(hire_id):
    """
    Advertiser approves the submitted creative deliverables, concluding and finalizing the sponsorship.
    """
    hire = HiredInfluencer.query.get_or_404(hire_id)
    hire.status = "COMPLETED"
    hire.completed_at = datetime.utcnow()
    hire.updated_at = datetime.utcnow()

    # Update creator stats
    influencer = Influencer.query.get(hire.influencer_id)
    if influencer:
        influencer.completed_campaigns = (influencer.completed_campaigns or 0) + 1

    # Update campaign performance metrics
    if hire.campaign_id:
        campaign = Campaign.query.get(hire.campaign_id)
        if campaign:
            metrics = dict(campaign.performance_metrics or {})
            hired_creators = [c for c in metrics.get("hired_creators", []) if c.get("id") != hire.id]
            hired_creators.append(hire.to_dict())
            metrics["hired_creators"] = hired_creators
            metrics["influencer_spend"] = sum(float(c.get("agreed_fee", 0)) for c in hired_creators)
            metrics["influencer_deliverables_completed"] = sum(1 for c in hired_creators if c.get("status") == "COMPLETED")
            campaign.performance_metrics = metrics

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Deliverables approved! Sponsorship {hire.id} is finalized and completed.",
        "contract": hire.to_dict()
    }), 200


@influencers_bp.post("/hired/<string:hire_id>/request-revision")
def request_contract_revision(hire_id):
    """
    Advertiser requests revision on submitted deliverables.
    """
    hire = HiredInfluencer.query.get_or_404(hire_id)
    data = request.get_json() or {}
    revision_notes = data.get("revision_notes", "").strip()

    if not revision_notes:
        return jsonify({"success": False, "message": "Revision feedback notes are required."}), 400

    hire.revision_notes = revision_notes
    hire.status = "REVISION_REQUESTED"
    hire.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Revision request sent to creator.",
        "contract": hire.to_dict()
    }), 200


@influencers_bp.patch("/hired/<string:hire_id>/status")
def update_hire_status(hire_id):
    """
    Update status of a hired influencer contract (e.g. REQUEST_RECEIVED, IN_OUTREACH, IN_PRODUCTION, COMPLETED, DECLINED, CANCELLED).
    """
    hire = HiredInfluencer.query.get_or_404(hire_id)
    data = request.get_json() or {}
    new_status = data.get("status")
    if not new_status:
        return jsonify({"success": False, "message": "Status is required"}), 400

    hire.status = new_status
    if "submission_url" in data:
        hire.submission_url = data["submission_url"]
    if "submission_notes" in data:
        hire.submission_notes = data["submission_notes"]
    if "brief_notes" in data:
        hire.brief_notes = data["brief_notes"]
    if new_status == "COMPLETED":
        if not hire.completed_at:
            hire.completed_at = datetime.utcnow()
        # Update creator completed count
        influencer = Influencer.query.get(hire.influencer_id)
        if influencer:
            influencer.completed_campaigns = (influencer.completed_campaigns or 0) + 1

    hire.updated_at = datetime.utcnow()

    # If linked to campaign, sync campaign performance metrics
    if hire.campaign_id:
        campaign = Campaign.query.get(hire.campaign_id)
        if campaign:
            metrics = dict(campaign.performance_metrics or {})
            hired_creators = [c for c in metrics.get("hired_creators", []) if c.get("id") != hire.id]
            hired_creators.append(hire.to_dict())
            metrics["hired_creators"] = hired_creators
            metrics["influencer_spend"] = sum(float(c.get("agreed_fee", 0)) for c in hired_creators)
            metrics["influencer_deliverables_completed"] = sum(1 for c in hired_creators if c.get("status") == "COMPLETED")
            campaign.performance_metrics = metrics

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Contract status updated to '{new_status}'.",
        "contract": hire.to_dict()
    }), 200


@influencers_bp.delete("/hired/<string:hire_id>")
def delete_hired_influencer(hire_id):
    """
    Cancel / remove a hired creator contract from database.
    """
    hire = HiredInfluencer.query.get_or_404(hire_id)
    db.session.delete(hire)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Creator sponsorship contract cancelled."
    }), 200


@influencers_bp.get("/campaign/<int:campaign_id>")
def get_campaign_influencers(campaign_id):
    """
    Get all hired creator contracts affiliated with a specific campaign from DB.
    """
    hired = HiredInfluencer.query.filter_by(campaign_id=campaign_id).order_by(HiredInfluencer.created_at.desc()).all()
    total_spend = sum(float(h.agreed_fee) for h in hired if h.agreed_fee)

    return jsonify({
        "success": True,
        "campaign_id": campaign_id,
        "hired_creators": [h.to_dict() for h in hired],
        "total_influencer_spend": total_spend
    }), 200


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
