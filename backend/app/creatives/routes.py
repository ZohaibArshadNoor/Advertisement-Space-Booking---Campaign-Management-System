import os
from flask import jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from app.creatives import creatives_bp
from app.creatives.schemas import MediaStatusUpdateSchema
from app.services.media_service import MediaService
from app.common.decorators import roles_required
from app.models.user import User
from app.models.campaign import Campaign
from app.extensions import db

status_schema = MediaStatusUpdateSchema()


def media_to_dict(media):
    return {
        "id": media.id,
        "media_reference": media.media_reference,
        "campaign_id": media.campaign_id,
        "campaign_name": media.campaign.name if media.campaign else None,
        "original_filename": media.original_filename,
        "file_type": media.file_type,
        "file_size_bytes": media.file_size,
        "dimensions": media.dimensions,
        "status": media.status,
        "rejection_reason": media.rejection_reason,
        "uploaded_by": media.uploaded_by,
        "uploaded_by_name": media.uploader.name if media.uploader else None,
        "reviewed_by_name": media.reviewer.name if media.reviewer else None,
        "download_url": f"/api/media/{media.id}/download",
        "created_at": media.created_at.isoformat() if media.created_at else None
    }


# 0. LIST ALL MEDIA ASSETS (For Creative Reviewers / Admins / Managers)
@creatives_bp.get("", strict_slashes=False)
@creatives_bp.get("/", strict_slashes=False)
@roles_required("Administrator", "Sales Executive", "Space Manager", "Creative Reviewer", "Advertiser")
def get_all_media():
    """
    List all creative media assets across campaigns.
    """
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id)) if current_user_id else None
    from app.models.creative import Creative
    
    if user and user.role and user.role.name == "Advertiser":
        from app.models.campaign import Campaign
        assets = Creative.query.join(Campaign).filter(Campaign.advertiser_id == user.advertiser_id).order_by(Creative.created_at.desc()).all()
    else:
        assets = Creative.query.order_by(Creative.created_at.desc()).all()
        
    return jsonify({
        "success": True,
        "media": [media_to_dict(a) for a in assets],
        "count": len(assets)
    }), 200


# 1. UPLOAD MEDIA ASSET TO CAMPAIGN
@creatives_bp.post("/campaigns/<int:campaign_id>")
@roles_required("Administrator", "Sales Executive", "Space Manager", "Advertiser")
def upload_media_asset(campaign_id):
    """
    Upload a media creative asset (.png, .jpg, .mp4, .pdf) to a campaign.
    ---
    tags:
      - Media & Creative Asset Management
    summary: Upload creative asset
    consumes:
      - multipart/form-data
    security:
      - Bearer: []
    parameters:
      - name: campaign_id
        in: path
        type: integer
        required: true
      - name: file
        in: formData
        type: file
        required: true
        description: Creative banner or video asset.
      - name: dimensions
        in: formData
        type: string
        example: "1920x1080"
    responses:
      201:
        description: Creative asset uploaded successfully in PENDING status.
      400:
        description: Invalid format or size exceeded.
      403:
        description: Forbidden.
      404:
        description: Campaign not found.
    """
    campaign = db.session.get(Campaign, campaign_id)
    if not campaign:
        return jsonify({"message": "Campaign not found."}), 404

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if current_user and current_user.role.name == "Advertiser":
        if campaign.user_id != current_user.id:
            return jsonify({"message": "You do not have permission to upload assets to this campaign."}), 403

    if "file" not in request.files:
        return jsonify({"message": "File part missing from form data."}), 400

    file = request.files["file"]
    dimensions = request.form.get("dimensions")

    creative, error = MediaService.upload_for_campaign(
        campaign_id=campaign.id,
        user_id=current_user_id,
        file=file,
        dimensions=dimensions
    )

    if error:
        return jsonify({"message": error}), 400

    return jsonify({
        "message": "Media asset uploaded successfully and submitted for review.",
        "media_asset": media_to_dict(creative)
    }), 201


# 2. LIST ASSETS FOR CAMPAIGN
@creatives_bp.get("/campaigns/<int:campaign_id>")
@roles_required("Administrator", "Sales Executive", "Space Manager", "Creative Reviewer", "Advertiser")
def get_campaign_media(campaign_id):
    """
    List all media assets uploaded for a campaign.
    ---
    tags:
      - Media & Creative Asset Management
    summary: List campaign media assets
    security:
      - Bearer: []
    parameters:
      - name: campaign_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Media assets retrieved.
      403:
        description: Forbidden.
      404:
        description: Campaign not found.
    """
    campaign = db.session.get(Campaign, campaign_id)
    if not campaign:
        return jsonify({"message": "Campaign not found."}), 404

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if current_user and current_user.role.name == "Advertiser":
        if campaign.user_id != current_user.id:
            return jsonify({"message": "You do not have permission to view assets for this campaign."}), 403

    assets = MediaService.get_by_campaign(campaign_id)
    return jsonify({
        "campaign_id": campaign_id,
        "total_assets": len(assets),
        "assets": [media_to_dict(a) for a in assets]
    }), 200


# 3. GET SINGLE MEDIA ASSET
@creatives_bp.get("/<int:media_id>")
@jwt_required()
def get_media_asset(media_id):
    """
    Get metadata for a specific media asset.
    ---
    tags:
      - Media & Creative Asset Management
    summary: Get media asset by ID
    security:
      - Bearer: []
    parameters:
      - name: media_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Media asset metadata returned.
      403:
        description: Forbidden.
      404:
        description: Media asset not found.
    """
    asset = MediaService.get_by_id(media_id)
    if not asset:
        return jsonify({"message": "Media asset not found."}), 404

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if current_user and current_user.role.name == "Advertiser":
        if asset.uploaded_by != current_user.id and (not asset.campaign or asset.campaign.user_id != current_user.id):
            return jsonify({"message": "You do not have permission to view this media asset."}), 403

    return jsonify({"media_asset": media_to_dict(asset)}), 200


# 4. DOWNLOAD MEDIA FILE
@creatives_bp.get("/<int:media_id>/download")
@jwt_required()
def download_media_file(media_id):
    """
    Download or stream the actual media file.
    ---
    tags:
      - Media & Creative Asset Management
    summary: Download media file
    security:
      - Bearer: []
    parameters:
      - name: media_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: File binary stream.
      403:
        description: Forbidden.
      404:
        description: File not found on disk.
    """
    asset = MediaService.get_by_id(media_id)
    if not asset:
        return jsonify({"message": "Media asset not found."}), 404

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if current_user and current_user.role.name == "Advertiser":
        if asset.uploaded_by != current_user.id and (not asset.campaign or asset.campaign.user_id != current_user.id):
            return jsonify({"message": "You do not have permission to download this media asset."}), 403

    full_path = os.path.join(os.getcwd(), asset.file_path)
    if not os.path.exists(full_path):
        return jsonify({"message": "File is missing on server storage."}), 404

    return send_file(
        full_path,
        mimetype=asset.file_type,
        as_attachment=False,
        download_name=asset.original_filename
    )


# 5. APPROVE OR REJECT ASSET
@creatives_bp.patch("/<int:media_id>/status")
@roles_required("Administrator", "Space Manager", "Creative Reviewer")
def update_media_status(media_id):
    """
    Approve or reject a creative asset.
    ---
    tags:
      - Media & Creative Asset Management
    summary: Approve or reject media asset
    security:
      - Bearer: []
    parameters:
      - name: media_id
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
              enum: [APPROVED, REJECTED]
              example: "APPROVED"
            rejection_reason:
              type: string
              example: "Dimensions do not match 1920x1080 billboard spec."
    responses:
      200:
        description: Asset status updated and uploader notified.
      400:
        description: Validation error.
      404:
        description: Asset not found.
    """
    asset = MediaService.get_by_id(media_id)
    if not asset:
        return jsonify({"message": "Media asset not found."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    try:
        validated = status_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    current_user_id = int(get_jwt_identity())
    updated, error = MediaService.update_status(
        creative=asset,
        new_status=validated["status"],
        reviewer_id=current_user_id,
        rejection_reason=validated.get("rejection_reason")
    )

    if error:
        return jsonify({"message": error}), 400

    return jsonify({
        "message": f"Media asset marked as {validated['status']}.",
        "media_asset": media_to_dict(updated)
    }), 200


# 6. DELETE MEDIA ASSET
@creatives_bp.delete("/<int:media_id>")
@roles_required("Administrator", "Space Manager", "Advertiser")
def delete_media_asset(media_id):
    """
    Delete a media asset and remove file from disk.
    ---
    tags:
      - Media & Creative Asset Management
    summary: Delete media asset
    security:
      - Bearer: []
    parameters:
      - name: media_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Media asset and file removed.
      403:
        description: Forbidden.
      404:
        description: Media asset not found.
    """
    asset = MediaService.get_by_id(media_id)
    if not asset:
        return jsonify({"message": "Media asset not found."}), 404

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if current_user and current_user.role.name == "Advertiser":
        if asset.uploaded_by != current_user.id:
            return jsonify({"message": "You do not have permission to delete this asset."}), 403

    MediaService.delete(asset, actor_id=current_user_id)

    return jsonify({
        "message": "Media asset and file deleted successfully."
    }), 200
