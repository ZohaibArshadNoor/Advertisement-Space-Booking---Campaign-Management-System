from datetime import datetime, timezone

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db


class User(UserMixin, db.Model):
    """
    Represents a user who can access the application.

    Users are assigned a role, such as Advertiser,
    Sales Executive, Space Manager, etc.
    """

    __tablename__ = "users"

    # Primary key.
    id = db.Column(db.Integer, primary_key=True)

    # User's display name.
    name = db.Column(
        db.String(120),
        nullable=False
    )

    # Email is used as the unique login identifier.
    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        index=True
    )

    # Stores the hashed password.
    #
    # We NEVER store the user's actual password.
    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    # Foreign key connecting the user to a role.
    role_id = db.Column(
        db.Integer,
        db.ForeignKey("roles.id"),
        nullable=False
    )

    # Foreign key connecting an advertiser user to an advertiser company.
    #
    # This is nullable because internal users such as Administrators,
    # Sales Executives, Finance Officers, and Space Managers do not
    # belong to an advertiser organization.
    advertiser_id = db.Column(
        db.Integer,
        db.ForeignKey("advertisers.id"),
        nullable=True,
        index=True
    )

    # Allows an administrator to deactivate an account
    # without deleting its historical records.
    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    # Records when the account was created.
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationship back to Role.
    role = db.relationship(
        "Role",
        back_populates="users"
    )
    
    # Relationship to the advertiser organization.
    # An advertiser organization can have multiple user accounts.
    advertiser = db.relationship(
        "Advertiser",
        back_populates="users"
    )

    def set_password(self, password):
        """
        Hashes a plain-text password and stores the hash.

        The original password is never stored in the database.
        """

        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """
        Checks a plain-text password against the stored hash.

        Returns True when the password is correct.
        """

        return check_password_hash(
            self.password_hash,
            password
        )

    def __repr__(self):
        """
        Useful representation when debugging.
        """

        return f"<User {self.email}>"