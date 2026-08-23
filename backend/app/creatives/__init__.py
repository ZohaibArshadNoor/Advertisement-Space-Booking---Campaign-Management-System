from flask import Blueprint

creatives_bp = Blueprint(
    "creatives",
    __name__,
    url_prefix="/api/media"
)

from app.creatives import routes
