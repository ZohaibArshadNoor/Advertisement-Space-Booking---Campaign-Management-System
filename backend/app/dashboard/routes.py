from flask import jsonify
from flask_jwt_extended import get_jwt_identity

from app.dashboard import dashboard_bp
from app.services.dashboard_service import DashboardService
from app.common.decorators import roles_required
from app.models.user import User
from app.extensions import db


# ===========================================================================
# DASHBOARD SUMMARY ENDPOINT
# ===========================================================================

@dashboard_bp.get("/summary")
@roles_required(
    "Administrator",
    "Space Manager",
    "Sales Executive",
    "Finance Officer",
    "Creative Reviewer",
    "Advertiser"
)
def get_dashboard_summary():
    """
    Get role-tailored dashboard summary metrics.
    ---
    tags:
      - Dashboard & Analytics

    summary: Get dashboard summary metrics

    description: >
      Returns real-time aggregated metrics across inventory, bookings, campaigns,
      and financial accounts. The response is automatically tailored and scoped
      to the authenticated user's role.

    security:
      - Bearer: []

    responses:
      200:
        description: Dashboard metrics retrieved successfully.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
    """
    # Step 1: Get current authenticated user context.
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if not current_user:
        return jsonify({"message": "User not found."}), 404

    # Step 2: Compute summary via the service layer.
    summary_data = DashboardService.get_summary_for_user(current_user)

    # Step 3: Return JSON response.
    return jsonify({
        "success": True,
        "summary": summary_data
    }), 200