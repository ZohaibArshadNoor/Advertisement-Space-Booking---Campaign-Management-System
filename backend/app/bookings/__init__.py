from flask import Blueprint

bookings_bp = Blueprint(
    "bookings",
    __name__,
    url_prefix="/api/bookings"
)

# Import routes after creating Blueprint to avoid circular imports.
from app.bookings import routes