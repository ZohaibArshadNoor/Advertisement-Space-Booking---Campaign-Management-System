from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.errors.handlers import make_error_response
from app.extensions import db
from app.models.user import User


def roles_required(*allowed_roles):
    """
    Restrict an endpoint to users with specific roles.
    """
    def decorator(view_function):
        @wraps(view_function)
        @jwt_required()
        def wrapped_view(*args, **kwargs):

            # Get the authenticated user's ID from the JWT.
            user_id = get_jwt_identity()

            # Load the actual user from the database.
            user = db.session.get(User, int(user_id))

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

            user_role = user.role.name

            if user_role not in allowed_roles:
                return make_error_response(
                    message="You do not have permission to access this resource.",
                    error_code="FORBIDDEN",
                    status_code=403
                )

            return view_function(*args, **kwargs)

        return wrapped_view

    return decorator