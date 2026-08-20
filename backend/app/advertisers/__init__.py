from flask import Blueprint


# Blueprint for all advertiser-related API endpoints.
advertisers_bp = Blueprint(
    "advertisers",
    __name__,
    url_prefix="/api/advertisers"
)


# Import routes after creating the Blueprint.
#
# This prevents circular import problems because routes.py
# needs access to advertisers_bp.
from app.advertisers import routes