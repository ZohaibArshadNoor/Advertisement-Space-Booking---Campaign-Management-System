from datetime import datetime, timezone

from app.extensions import db


class AuditAction:
    """
    Standardized action types for audit trail logging.
    """
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    UPDATE_STATUS = "UPDATE_STATUS"
    DELETE = "DELETE"
    LOGIN = "LOGIN"

    ALL = [
        CREATE,
        UPDATE,
        UPDATE_STATUS,
        DELETE,
        LOGIN
    ]


class AuditLog(db.Model):
    """
    Represents an immutable audit log record.
    Tracks state transitions, entity modifications, and user identity.
    """

    __tablename__ = "audit_logs"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # Actor who performed the action (nullable for system-automated events)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    # Action type (CREATE, UPDATE, UPDATE_STATUS, DELETE, LOGIN)
    action = db.Column(
        db.String(50),
        nullable=False,
        index=True
    )

    # Target entity type (e.g. Booking, Campaign, Invoice, Payment, AdvertisingSpace)
    entity_type = db.Column(
        db.String(50),
        nullable=False,
        index=True
    )

    # Primary key ID of the modified entity
    entity_id = db.Column(
        db.Integer,
        nullable=True,
        index=True
    )

    # Snapshot of state before change
    old_values = db.Column(
        db.JSON,
        nullable=True
    )

    # Snapshot of state after change
    new_values = db.Column(
        db.JSON,
        nullable=True
    )

    # Client IP address if available
    ip_address = db.Column(
        db.String(45),
        nullable=True
    )

    # Timestamp of the event
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True
    )

    # Relationship to User
    user = db.relationship(
        "User",
        backref=db.backref("audit_logs", lazy=True)
    )

    def __repr__(self):
        return (
            f"<AuditLog {self.id} action={self.action} "
            f"entity={self.entity_type}:{self.entity_id} user={self.user_id}>"
        )