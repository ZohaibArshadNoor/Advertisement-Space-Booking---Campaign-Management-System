from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError

from app.reports import reports_bp
from app.reports.schemas import DateRangeReportQuerySchema
from app.services.report_service import ReportService
from app.common.decorators import roles_required
from app.models.user import User
from app.extensions import db

query_schema = DateRangeReportQuerySchema()


# ===========================================================================
# 1. REVENUE REPORT
# ===========================================================================
@reports_bp.get("/revenue")
@roles_required("Administrator", "Finance Officer", "Sales Executive", "Advertiser")
def get_revenue_report():
    """
    Generate revenue, collection, and payment analytics report.
    ---
    tags:
      - Reports & Advanced Analytics
    summary: Financial and revenue report
    security:
      - Bearer: []
    parameters:
      - name: start_date
        in: query
        type: string
        format: date
        example: "2026-01-01"
      - name: end_date
        in: query
        type: string
        format: date
        example: "2026-12-31"
    responses:
      200:
        description: Financial report generated successfully.
      400:
        description: Invalid date parameters.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
    """
    try:
        validated = query_schema.load(request.args)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    advertiser_filter = None
    if current_user and current_user.role.name == "Advertiser":
        advertiser_filter = current_user.advertiser_id

    report = ReportService.get_revenue_report(
        start_date=validated.get("start_date"),
        end_date=validated.get("end_date"),
        advertiser_id=advertiser_filter
    )

    return jsonify({"success": True, "report": report}), 200


# ===========================================================================
# 2. SPACE UTILIZATION REPORT
# ===========================================================================
@reports_bp.get("/spaces")
@roles_required("Administrator", "Space Manager", "Sales Executive")
def get_space_utilization_report():
    """
    Generate inventory occupancy and space utilization report.
    ---
    tags:
      - Reports & Advanced Analytics
    summary: Space utilization & occupancy report
    security:
      - Bearer: []
    parameters:
      - name: start_date
        in: query
        type: string
        format: date
        example: "2026-01-01"
      - name: end_date
        in: query
        type: string
        format: date
        example: "2026-12-31"
    responses:
      200:
        description: Space utilization report generated successfully.
      400:
        description: Invalid date parameters.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
    """
    try:
        validated = query_schema.load(request.args)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    report = ReportService.get_space_utilization_report(
        start_date=validated.get("start_date"),
        end_date=validated.get("end_date")
    )

    return jsonify({"success": True, "report": report}), 200


# ===========================================================================
# 3. BOOKING TRENDS REPORT
# ===========================================================================
@reports_bp.get("/bookings")
@roles_required("Administrator", "Sales Executive", "Space Manager", "Advertiser")
def get_booking_report():
    """
    Generate booking volume, status distribution, and ticket size report.
    ---
    tags:
      - Reports & Advanced Analytics
    summary: Booking volume and conversion report
    security:
      - Bearer: []
    parameters:
      - name: start_date
        in: query
        type: string
        format: date
      - name: end_date
        in: query
        type: string
        format: date
    responses:
      200:
        description: Booking report generated successfully.
      400:
        description: Invalid date parameters.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
    """
    try:
        validated = query_schema.load(request.args)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    user_filter = None
    if current_user and current_user.role.name == "Advertiser":
        user_filter = current_user.id

    report = ReportService.get_booking_report(
        start_date=validated.get("start_date"),
        end_date=validated.get("end_date"),
        user_id=user_filter
    )

    return jsonify({"success": True, "report": report}), 200


# ===========================================================================
# 4. CAMPAIGN ANALYTICS REPORT
# ===========================================================================
@reports_bp.get("/campaigns")
@roles_required("Administrator", "Sales Executive", "Advertiser")
def get_campaign_report():
    """
    Generate campaign pipeline and planned budget report.
    ---
    tags:
      - Reports & Advanced Analytics
    summary: Campaign pipeline and budget report
    security:
      - Bearer: []
    parameters:
      - name: start_date
        in: query
        type: string
        format: date
      - name: end_date
        in: query
        type: string
        format: date
    responses:
      200:
        description: Campaign report generated successfully.
      400:
        description: Invalid date parameters.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
    """
    try:
        validated = query_schema.load(request.args)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    user_filter = None
    if current_user and current_user.role.name == "Advertiser":
        user_filter = current_user.id

    report = ReportService.get_campaign_report(
        start_date=validated.get("start_date"),
        end_date=validated.get("end_date"),
        user_id=user_filter
    )

    return jsonify({"success": True, "report": report}), 200
