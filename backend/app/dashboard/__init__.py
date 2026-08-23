from flask import Blueprint

dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/api/dashboard"
)

# Import routes to register with blueprint
from app.dashboard import routes