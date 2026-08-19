from flask import Blueprint


# Blueprint containing user management endpoints.
users_bp = Blueprint(
    "users",
    __name__,
    url_prefix="/api/users"
)

# Import routes after creating the Blueprint to avoid circular import.
from app.users import routes
