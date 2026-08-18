from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.user import User


def roles_required(*allowed_roles):
    """
    Restrict an endpoint to users with specific roles.

    Example:

        @roles_required("Administrator")
        def admin_endpoint():
            ...

    Multiple roles can also be supplied:

        @roles_required(
            "Administrator",
            "Finance Officer"
        )

    In that case, either role is allowed.
    """

    def decorator(view_function):
        @wraps(view_function)
        @jwt_required()
        def wrapped_view(*args, **kwargs):

            # Get the authenticated user's ID from the JWT.
            user_id = get_jwt_identity()

            # Load the actual user from the database.
            user = db.session.get(User, int(user_id))

            # The token may be valid even if the user has
            # subsequently been deleted from the database.
            if user is None:
                return jsonify({
                    "success": False,
                    "message": "User account no longer exists."
                }), 404

            # Prevent inactive users from accessing protected
            # role-based endpoints.
            if not user.is_active:
                return jsonify({
                    "success": False,
                    "message": "Your account is inactive."
                }), 403

            # Get the user's role from the database.
            user_role = user.role.name

            # Check whether the user's role is permitted.
            if user_role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": "You do not have permission to access this resource."
                }), 403

            # The user has the required role.
            return view_function(*args, **kwargs)

        return wrapped_view

    return decorator