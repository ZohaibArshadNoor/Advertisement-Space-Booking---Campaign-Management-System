from flask import Blueprint

campaigns_bp = Blueprint(
    "campaigns",
    __name__,
    url_prefix="/api/campaigns"
)

# Import routes to register with blueprint
from app.campaigns import routes