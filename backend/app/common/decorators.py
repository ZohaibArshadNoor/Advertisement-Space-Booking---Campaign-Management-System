from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.errors.handlers import make_error_response
from app.extensions import db
from app.models.user import User


def _get_current_authenticated_user():
    user_id = get_jwt_identity()
    if isinstance(user_id, dict):
        user_id = user_id.get("id")
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return None
    return db.session.get(User, user_id)


def roles_required(*allowed_roles, permissions=None):
    """
    Restrict an endpoint to users with specific roles or granted dynamic RBAC permissions.
    """
    perms_list = []
    if permissions:
        if isinstance(permissions, str):
            perms_list = [permissions]
        elif isinstance(permissions, (list, tuple, set)):
            perms_list = list(permissions)

    def decorator(view_function):
        @wraps(view_function)
        @jwt_required()
        def wrapped_view(*args, **kwargs):
            user = _get_current_authenticated_user()

            if user is None:
                return make_error_response(
                    message="User account no longer exists.",
                    error_code="USER_NOT_FOUND",
                    status_code=404
                )

            if not user.is_active:
                return make_error_response(
                    message="Your account is inactive.",
                    error_code="ACCOUNT_INACTIVE",
                    status_code=403
                )

            user_role = user.role.name if user.role else ""

            # Master Administrator bypass
            if user_role == "Administrator":
                return view_function(*args, **kwargs)

            # Check direct role match
            if allowed_roles and user_role in allowed_roles:
                return view_function(*args, **kwargs)

            # Check dynamic RBAC permissions dictionary on the assigned role
            user_perms = user.role.permissions if (user.role and user.role.permissions) else {}
            if perms_list:
                for p in perms_list:
                    if user_perms.get(p) is True:
                        return view_function(*args, **kwargs)

            return make_error_response(
                message="You do not have permission to access this resource.",
                error_code="FORBIDDEN",
                status_code=403
            )

        return wrapped_view

    return decorator


def permissions_required(*permissions, allowed_roles=None):
    """
    Restrict endpoint based on RBAC permissions matrix.
    """
    return roles_required(*(allowed_roles or []), permissions=permissions)