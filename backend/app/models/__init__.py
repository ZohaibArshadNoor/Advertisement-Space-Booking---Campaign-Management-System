"""
Database models for the Advertisement Booking system.

Importing the models here ensures that SQLAlchemy knows about
them when Flask-Migrate examines the application's metadata.
"""

from app.models.role import Role
from app.models.user import User


__all__ = [
    "Role",
    "User",
]