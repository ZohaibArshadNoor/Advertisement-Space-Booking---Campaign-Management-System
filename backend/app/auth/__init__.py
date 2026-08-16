from flask import Blueprint


# Authentication-related API endpoints.
auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


# Import routes after creating the Blueprint.
#
# This registers the route functions with auth_bp.
from app.auth import routes