from datetime import datetime, timezone

from app.extensions import db


class Role(db.Model):
    """
    Represents a role in the application.

    A role defines what type of user someone is and,
    eventually, what operations that user is allowed to perform.
    """

    __tablename__ = "roles"

    # Primary key.
    id = db.Column(db.Integer, primary_key=True)

    # Human-readable role name.
    #
    # unique=True prevents duplicate role names.
    # nullable=False means every role must have a name.
    name = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    # Stores permissions associated with the role.
    #
    # We are keeping this as JSON because the requirement specifies
    # a permissions field, and it gives us flexibility to expand
    # permissions later without changing the table structure.
    permissions = db.Column(
        db.JSON,
        nullable=False,
        default=dict
    )

    # Automatically records when the role was created.
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationship to users.
    #
    # One role can belong to many users.
    users = db.relationship(
        "User",
        back_populates="role"
    )

    def __repr__(self):
        """
        Useful representation when debugging in the Flask shell.
        """

        return f"<Role {self.name}>"