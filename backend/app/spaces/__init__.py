from flask import Blueprint


# Blueprint responsible for all advertising space related APIs.
spaces_bp = Blueprint(
    "spaces",
    __name__,
    url_prefix="/api/spaces"
)


# Import routes after creating the Blueprint.
#
# routes.py needs access to spaces_bp, so importing it here
# after the Blueprint is created prevents circular imports.
from app.spaces import routes