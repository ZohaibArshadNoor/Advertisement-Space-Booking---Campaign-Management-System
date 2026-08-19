from flask import jsonify

from app.common.decorators import roles_required
from app.models.user import User
from app.users import users_bp


@users_bp.get("/")
@roles_required("Administrator")
def get_users():
    """
    Return all users.

    ---
    tags:
      - User Management
    summary: List all users
    description: Returns all registered users. Administrator access required.
    security:
      - Bearer: []
    responses:
      200:
        description: Users retrieved successfully
      401:
        description: Authentication required
      403:
        description: Administrator access required
    """

    # Query all users from PostgreSQL.
    users = User.query.order_by(User.id.asc()).all()

    # Convert database records into safe API responses.
    #
    # Never return password_hash or other sensitive fields.
    user_list = [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.name,
            "is_active": user.is_active,
            "created_at": (
                user.created_at.isoformat()
                if user.created_at
                else None
            )
        }
        for user in users
    ]

    return jsonify({
        "success": True,
        "count": len(user_list),
        "users": user_list
    }), 200