from flask import request
from flask_jwt_extended import get_jwt_identity     
from app.extensions import db
from app.models.audit import AuditLog, AuditAction


class AuditService:
    """
    Central service for creating and querying system audit logs.
    """

    @staticmethod
    def log(
        action: str,
        entity_type: str,
        entity_id: int = None,
        user_id: int = None,
        old_values: dict = None,
        new_values: dict = None,
        ip_address: str = None
    ) -> AuditLog:
        """
        Records an immutable audit entry.
        """
        # Automatically detect authenticated user from JWT if not passed
        if user_id is None:
            try:
                identity = get_jwt_identity()
                if identity is not None:
                    user_id = int(identity)
            except Exception:
                user_id = None

        if not ip_address:
            try:
                ip_address = request.remote_addr
            except Exception:
                ip_address = None

        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address
        )

        db.session.add(log_entry)
        db.session.commit()
        return log_entry

    @staticmethod
    def get_logs(
        page: int = 1,
        per_page: int = 20,
        user_id: int = None,
        entity_type: str = None,
        entity_id: int = None,
        action: str = None
    ):
        """
        Returns paginated audit records with optional filters.
        """
        query = AuditLog.query

        if user_id is not None:
            query = query.filter_by(user_id=user_id)

        if entity_type:
            query = query.filter_by(entity_type=entity_type)

        if entity_id is not None:
            query = query.filter_by(entity_id=entity_id)

        if action:
            query = query.filter_by(action=action)

        return query.order_by(
            AuditLog.created_at.desc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

    @staticmethod
    def get_by_id(log_id: int) -> AuditLog:
        """
        Returns a single audit log entry by primary key ID.
        """
        return db.session.get(AuditLog, log_id)