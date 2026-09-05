from flask import Blueprint

influencers_bp = Blueprint("influencers", __name__, url_prefix="/api/influencers")

from app.influencers import routes
