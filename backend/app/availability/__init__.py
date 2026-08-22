from flask import Blueprint

availability_bp = Blueprint(
    "availability",
    __name__,
    url_prefix="/api/availability"
)

# Import routes to register them with the blueprint
from app.availability import routes
