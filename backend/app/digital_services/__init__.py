from flask import Blueprint

digital_services_bp = Blueprint("digital_services", __name__, url_prefix="/api/digital-services")

from app.digital_services import routes
