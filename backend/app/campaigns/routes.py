from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError

from app.campaigns import campaigns_bp
from app.campaigns.schemas import (
    CampaignCreateSchema,
    CampaignUpdateSchema,
    CampaignStatusUpdateSchema
)
from app.services.campaign_service import CampaignService
from app.common.decorators import roles_required
from app.models.user import User
from app.extensions import db

# ===========================================================================
# SCHEMA INSTANCES
# ===========================================================================

campaign_create_schema = CampaignCreateSchema()
campaign_update_schema = CampaignUpdateSchema()
campaign_status_update_schema = CampaignStatusUpdateSchema()


# ===========================================================================
# HELPER FUNCTIONS
# ===========================================================================

def campaign_to_dict(campaign, include_bookings=False):
    """
    Converts a Campaign database object into JSON-safe data.
    """
    data = {
        "id": campaign.id,
        "campaign_reference": campaign.campaign_reference,
        "user_id": campaign.user_id,
        "user_name": campaign.user.name if campaign.user else None,
        "advertiser_id": campaign.advertiser_id,
        "advertiser_name": (
            campaign.advertiser.company_name
            if campaign.advertiser
            else None
        ),
        "name": campaign.name,
        "description": campaign.description,
        "status": campaign.status,
        "start_date": (
            campaign.start_date.isoformat()
            if campaign.start_date
            else None
        ),
        "end_date": (
            campaign.end_date.isoformat()
            if campaign.end_date
            else None
        ),
        "budget": (
            str(campaign.budget)
            if campaign.budget is not None
            else None
        ),
        "total_bookings": len(campaign.bookings),
        "created_at": (
            campaign.created_at.isoformat()
            if campaign.created_at
            else None
        ),
        "updated_at": (
            campaign.updated_at.isoformat()
            if campaign.updated_at
            else None
        )
    }

    if include_bookings:
        data["bookings"] = [
            {
                "id": b.id,
                "booking_reference": b.booking_reference,
                "space_id": b.space_id,
                "space_name": b.space.name if b.space else None,
                "start_date": b.start_date.isoformat(),
                "end_date": b.end_date.isoformat(),
                "status": b.status,
                "total_price": str(b.total_price)
            }
            for b in campaign.bookings
        ]

    return data


# ===========================================================================
# CAMPAIGN ENDPOINTS
# ===========================================================================

# 1. CREATE CAMPAIGN
@campaigns_bp.post("")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager",
    "Advertiser"
)
def create_campaign():
    """
    Create a new advertising campaign.
    ---
    tags:
      - Campaign Management

    summary: Create a campaign

    description: >
      Creates a new strategic advertising campaign container.
      Accessible by Administrator, Sales Executive, Space Manager, and Advertiser.

    security:
      - Bearer: []

    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
          properties:
            name:
              type: string
              example: "Summer Mega Sale 2026"
            description:
              type: string
              example: "Nationwide summer product launch"
            start_date:
              type: string
              format: date
              example: "2026-06-01"
            end_date:
              type: string
              format: date
              example: "2026-08-31"
            budget:
              type: string
              example: "15000000.00"
            advertiser_id:
              type: integer
              example: 1

    responses:
      201:
        description: Campaign created successfully.
      400:
        description: Validation error.
      401:
        description: Authentication required.
    """
    # Step 1: Read JSON request data.
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    # Step 2: Validate payload.
    try:
        validated_data = campaign_create_schema.load(data)
    except ValidationError as error:
        return jsonify({"errors": error.messages}), 400

    # Step 3: Identify creator context.
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    advertiser_id = validated_data.get("advertiser_id")
    if not advertiser_id and current_user and current_user.advertiser_id:
        advertiser_id = current_user.advertiser_id

    # Step 4: Create campaign record.
    campaign = CampaignService.create(
        user_id=current_user_id,
        name=validated_data["name"],
        description=validated_data.get("description"),
        start_date=validated_data.get("start_date"),
        end_date=validated_data.get("end_date"),
        budget=validated_data.get("budget"),
        advertiser_id=advertiser_id
    )

    # Step 5: Return created campaign.
    return jsonify({
        "message": "Campaign created successfully.",
        "campaign": campaign_to_dict(campaign)
    }), 201


# 2. LIST CAMPAIGNS
@campaigns_bp.get("")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager",
    "Finance Officer",
    "Advertiser"
)
def get_campaigns():
    """
    List campaigns with pagination and filters.
    ---
    tags:
      - Campaign Management

    summary: List campaigns

    description: >
      Returns paginated list of campaigns. Advertisers only see their own campaigns.
      Internal agency staff can see all campaigns.

    security:
      - Bearer: []

    parameters:
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 10
      - name: status
        in: query
        type: string
        enum: [DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED]
      - name: start_date
        in: query
        type: string
        format: date
      - name: end_date
        in: query
        type: string
        format: date
      - name: min_budget
        in: query
        type: number
      - name: max_budget
        in: query
        type: number
      - name: search
        in: query
        type: string
        description: Keyword search on name, description, or reference.
      - name: sort_by
        in: query
        type: string
        enum: [created_at, name, start_date, budget, status]
        default: created_at
      - name: sort_order
        in: query
        type: string
        enum: [asc, desc]
        default: desc

    responses:
      200:
        description: Campaigns retrieved successfully.
    """
    # Step 1: Extract query parameters.
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    status = request.args.get("status")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    min_budget = request.args.get("min_budget", type=float)
    max_budget = request.args.get("max_budget", type=float)
    search = request.args.get("search")
    sort_by = request.args.get("sort_by", default="created_at")
    sort_order = request.args.get("sort_order", default="desc")

    if page < 1:
        return jsonify({"message": "Page must be greater than zero."}), 400

    if per_page < 1 or per_page > 100:
        return jsonify({"message": "per_page must be between 1 and 100."}), 400

    # Step 2: Role-based filtering.
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    user_filter = None
    if current_user and current_user.role.name == "Advertiser":
        user_filter = current_user.id

    # Step 3: Query paginated results.
    campaigns_page = CampaignService.get_all(
        page=page,
        per_page=per_page,
        user_id=user_filter,
        status=status,
        start_date=start_date,
        end_date=end_date,
        min_budget=min_budget,
        max_budget=max_budget,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )

    # Step 4: Return response.
    return jsonify({
        "campaigns": [
            campaign_to_dict(c)
            for c in campaigns_page.items
        ],
        "pagination": {
            "page": campaigns_page.page,
            "per_page": campaigns_page.per_page,
            "total": campaigns_page.total,
            "pages": campaigns_page.pages
        }
    }), 200


# 3. GET SINGLE CAMPAIGN
@campaigns_bp.get("/<int:campaign_id>")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager",
    "Finance Officer",
    "Advertiser"
)
def get_campaign(campaign_id):
    """
    Get detailed information about a campaign including its attached bookings.
    ---
    tags:
      - Campaign Management

    summary: Get campaign by ID

    security:
      - Bearer: []

    parameters:
      - name: campaign_id
        in: path
        type: integer
        required: true

    responses:
      200:
        description: Campaign retrieved successfully.
      403:
        description: Insufficient permissions.
      404:
        description: Campaign not found.
    """
    # Step 1: Find campaign.
    campaign = CampaignService.get_by_id(campaign_id)
    if not campaign:
        return jsonify({"message": "Campaign not found."}), 404

    # Step 2: Enforce privacy for Advertisers.
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if current_user and current_user.role.name == "Advertiser":
        if campaign.user_id != current_user.id:
            return jsonify({
                "message": "You do not have permission to access this campaign."
            }), 403

    # Step 3: Return campaign with bookings.
    return jsonify({
        "campaign": campaign_to_dict(campaign, include_bookings=True)
    }), 200


# 4. UPDATE CAMPAIGN
@campaigns_bp.patch("/<int:campaign_id>")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager",
    "Advertiser"
)
def update_campaign(campaign_id):
    """
    Update campaign details.
    ---
    tags:
      - Campaign Management

    summary: Update a campaign

    security:
      - Bearer: []

    parameters:
      - name: campaign_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
            description:
              type: string
            start_date:
              type: string
              format: date
            end_date:
              type: string
              format: date
            budget:
              type: string

    responses:
      200:
        description: Campaign updated successfully.
      403:
        description: Insufficient permissions.
      404:
        description: Campaign not found.
    """
    campaign = CampaignService.get_by_id(campaign_id)
    if not campaign:
        return jsonify({"message": "Campaign not found."}), 404

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if current_user and current_user.role.name == "Advertiser":
        if campaign.user_id != current_user.id:
            return jsonify({
                "message": "You do not have permission to update this campaign."
            }), 403

    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    try:
        validated_data = campaign_update_schema.load(data)
    except ValidationError as error:
        return jsonify({"errors": error.messages}), 400

    updated = CampaignService.update(campaign, validated_data)

    return jsonify({
        "message": "Campaign updated successfully.",
        "campaign": campaign_to_dict(updated)
    }), 200


# 5. UPDATE CAMPAIGN STATUS
@campaigns_bp.patch("/<int:campaign_id>/status")
@roles_required(
    "Administrator",
    "Space Manager"
)
def update_campaign_status(campaign_id):
    """
    Update the lifecycle status of a campaign.
    ---
    tags:
      - Campaign Management

    summary: Update campaign status

    security:
      - Bearer: []

    parameters:
      - name: campaign_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - status
          properties:
            status:
              type: string
              enum: [DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED]

    responses:
      200:
        description: Campaign status updated successfully.
      400:
        description: Invalid status value.
      404:
        description: Campaign not found.
    """
    campaign = CampaignService.get_by_id(campaign_id)
    if not campaign:
        return jsonify({"message": "Campaign not found."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    try:
        validated_data = campaign_status_update_schema.load(data)
    except ValidationError as error:
        return jsonify({"errors": error.messages}), 400

    updated, error = CampaignService.update_status(
        campaign=campaign,
        new_status=validated_data["status"]
    )

    if error:
        return jsonify({"message": error}), 400

    return jsonify({
        "message": f"Campaign status updated to {validated_data['status']}.",
        "campaign": campaign_to_dict(updated)
    }), 200


# 6. DELETE CAMPAIGN
@campaigns_bp.delete("/<int:campaign_id>")
@roles_required(
    "Administrator",
    "Space Manager",
    "Advertiser"
)
def delete_campaign(campaign_id):
    """
    Delete a campaign and its associated records.
    ---
    tags:
      - Campaign Management

    summary: Delete a campaign

    security:
      - Bearer: []

    parameters:
      - name: campaign_id
        in: path
        type: integer
        required: true

    responses:
      200:
        description: Campaign deleted successfully.
      403:
        description: Insufficient permissions.
      404:
        description: Campaign not found.
    """
    campaign = CampaignService.get_by_id(campaign_id)
    if not campaign:
        return jsonify({"message": "Campaign not found."}), 404

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if current_user and current_user.role.name == "Advertiser":
        if campaign.user_id != current_user.id:
            return jsonify({
                "message": "You do not have permission to delete this campaign."
            }), 403

    CampaignService.delete(campaign)

    return jsonify({
        "message": "Campaign deleted successfully."
    }), 200