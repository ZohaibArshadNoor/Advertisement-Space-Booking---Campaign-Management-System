from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError

from app.common.decorators import roles_required
from app.extensions import db
from app.models.role import Role
from app.models.user import User
from app.models.audit import AuditAction
from app.models.notification import NotificationType
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService
from app.users import users_bp
from app.users.schemas import (
    CreateUserSchema,
    UpdateUserSchema,
    UpdateUserStatusSchema,
    AdminResetPasswordSchema,
)

create_user_schema = CreateUserSchema()
update_user_schema = UpdateUserSchema()
status_schema = UpdateUserStatusSchema()
reset_password_schema = AdminResetPasswordSchema()


# 1. LIST ALL USERS
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
    users = User.query.order_by(User.id.asc()).all()

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


# 2. GET SINGLE USER BY ID
@users_bp.get("/<int:user_id>")
@roles_required("Administrator")
def get_user(user_id):
    """
    Get a single user by ID.

    ---
    tags:
      - User Management
    summary: Get a user
    description: Returns a single user by ID. Administrator access required.
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        required: true
        type: integer
        description: ID of the user to retrieve
        example: 1
    responses:
      200:
        description: User retrieved successfully
      401:
        description: Authentication required
      403:
        description: Administrator access required
      404:
        description: User not found
    """
    user = User.query.get(user_id)

    if user is None:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    return jsonify({
        "success": True,
        "user": {
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
    }), 200


# 3. CREATE USER (Admin Provisioning)
@users_bp.post("/")
@roles_required("Administrator")
def create_user():
    """
    Create a new user account with an assigned role.

    ---
    tags:
      - User Management
    summary: Create a user
    description: Allows an Administrator to provision a new user.
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
            - email
            - password
            - role_id
          properties:
            name:
              type: string
              example: "Jane Staff"
            email:
              type: string
              example: "staff@example.com"
            password:
              type: string
              example: "SecurePassword123"
            role_id:
              type: integer
              example: 2
    responses:
      201:
        description: User created successfully
      400:
        description: Validation error
      404:
        description: Role not found
      409:
        description: Email already in use
    """
    try:
        data = create_user_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({
            "success": False,
            "errors": err.messages
        }), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({
            "success": False,
            "message": "Email is already registered."
        }), 409

    role = Role.query.get(data["role_id"])
    if not role:
        return jsonify({
            "success": False,
            "message": "Role not found."
        }), 404

    user = User(
        name=data["name"],
        email=data["email"],
        role_id=role.id,
        is_active=True
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    current_user_id = get_jwt_identity()
    try:
        current_user_id = int(current_user_id)
    except (TypeError, ValueError):
        pass

    try:
        AuditService.log(
            action=AuditAction.CREATE,
            entity_type="User",
            entity_id=user.id,
            user_id=current_user_id,
            new_values={
                "name": user.name,
                "email": user.email,
                "role": user.role.name if user.role else role.name,
                "is_active": user.is_active
            }
        )
    except Exception:
        pass

    try:
        NotificationService.send_notification(
            user_id=user.id,
            title="Welcome to AdFlow Enterprise OOH",
            message=f"Welcome {user.name}! Your account has been provisioned with the {user.role.name} role.",
            notification_type=NotificationType.SYSTEM,
            link="/dashboard"
        )
    except Exception:
        pass

    return jsonify({
        "success": True,
        "message": "User created successfully.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.name,
            "is_active": user.is_active
        }
    }), 201


# 4. UPDATE USER
@users_bp.put("/<int:user_id>")
@roles_required("Administrator")
def update_user(user_id):
    """
    Update an existing user's details.

    ---
    tags:
      - User Management
    summary: Update user
    description: Updates user name, email, or role. Administrator access required.
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: path
        name: user_id
        required: true
        type: integer
        example: 2
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
              example: "Jane Updated"
            email:
              type: string
              example: "updated@example.com"
            role_id:
              type: integer
              example: 3
    responses:
      200:
        description: User updated successfully
      400:
        description: Validation error
      404:
        description: User or role not found
      409:
        description: Email already in use
    """
    user = User.query.get(user_id)
    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    try:
        data = update_user_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({
            "success": False,
            "errors": err.messages
        }), 400

    old_values = {
        "name": user.name,
        "email": user.email,
        "role": user.role.name if user.role else None,
        "role_id": user.role_id
    }

    if "email" in data and data["email"] != user.email:
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({
                "success": False,
                "message": "Email is already in use."
            }), 409
        user.email = data["email"]

    if "name" in data:
        user.name = data["name"]

    if "role_id" in data:
        role = Role.query.get(data["role_id"])
        if not role:
            return jsonify({
                "success": False,
                "message": "Role not found."
            }), 404
        user.role_id = role.id

    db.session.commit()

    current_user_id = get_jwt_identity()
    try:
        current_user_id = int(current_user_id)
    except (TypeError, ValueError):
        pass

    try:
        AuditService.log(
            action=AuditAction.UPDATE,
            entity_type="User",
            entity_id=user.id,
            user_id=current_user_id,
            old_values=old_values,
            new_values={
                "name": user.name,
                "email": user.email,
                "role": user.role.name if user.role else None,
                "role_id": user.role_id
            }
        )
    except Exception:
        pass

    return jsonify({
        "success": True,
        "message": "User updated successfully.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.name,
            "is_active": user.is_active
        }
    }), 200


# 5. ACTIVATE / DEACTIVATE USER
@users_bp.patch("/<int:user_id>/status")
@roles_required("Administrator")
def update_user_status(user_id):
    """
    Activate or deactivate a user account.

    ---
    tags:
      - User Management
    summary: Toggle user status
    description: Enable or disable a user account. Admins cannot deactivate themselves.
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: path
        name: user_id
        required: true
        type: integer
        example: 2
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - is_active
          properties:
            is_active:
              type: boolean
              example: false
    responses:
      200:
        description: Status updated successfully
      400:
        description: Validation error or self-deactivation attempt
      404:
        description: User not found
    """
    user = User.query.get(user_id)
    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    current_user_id = get_jwt_identity()
    try:
        current_user_id = int(current_user_id)
    except (TypeError, ValueError):
        pass

    try:
        data = status_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({
            "success": False,
            "errors": err.messages
        }), 400

    if user.id == current_user_id and data["is_active"] is False:
        return jsonify({
            "success": False,
            "message": "You cannot deactivate your own account."
        }), 400

    old_status = user.is_active
    user.is_active = data["is_active"]
    db.session.commit()

    try:
        AuditService.log(
            action=AuditAction.UPDATE_STATUS,
            entity_type="User",
            entity_id=user.id,
            user_id=current_user_id,
            old_values={"is_active": old_status, "email": user.email, "name": user.name},
            new_values={"is_active": user.is_active, "email": user.email, "name": user.name}
        )
    except Exception:
        pass

    try:
        status_word = "activated" if user.is_active else "deactivated"
        NotificationService.send_notification(
            user_id=user.id,
            title=f"Account Status Changed: {status_word.capitalize()}",
            message=f"Your account status was {status_word} by an Administrator.",
            notification_type=NotificationType.SYSTEM,
            link="/profile"
        )
    except Exception:
        pass

    return jsonify({
        "success": True,
        "message": (
            f"User account "
            f"{'activated' if user.is_active else 'deactivated'} successfully."
        ),
        "user": {
            "id": user.id,
            "email": user.email,
            "is_active": user.is_active
        }
    }), 200


# 6. RESET PASSWORD
@users_bp.post("/<int:user_id>/reset-password")
@roles_required("Administrator")
def admin_reset_password(user_id):
    """
    Reset a user's password.

    ---
    tags:
      - User Management
    summary: Reset user password
    description: Allows an Administrator to set a new password for any user account.
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: path
        name: user_id
        required: true
        type: integer
        example: 2
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - new_password
          properties:
            new_password:
              type: string
              example: "NewSecurePassword123!"
    responses:
      200:
        description: Password reset successfully
      400:
        description: Validation error
      404:
        description: User not found
    """
    user = User.query.get(user_id)
    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    current_user_id = get_jwt_identity()
    try:
        current_user_id = int(current_user_id)
    except (TypeError, ValueError):
        pass

    try:
        data = reset_password_schema.load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({
            "success": False,
            "errors": err.messages
        }), 400

    new_pwd = data.get("new_password") or data.get("password")
    if not new_pwd:
        return jsonify({
            "success": False,
            "message": "Password is required (minimum 8 characters)."
        }), 400

    user.set_password(new_pwd)
    db.session.commit()

    try:
        AuditService.log(
            action=AuditAction.UPDATE,
            entity_type="User",
            entity_id=user.id,
            user_id=current_user_id,
            new_values={"event": "ADMIN_PASSWORD_RESET", "email": user.email, "name": user.name}
        )
    except Exception:
        pass

    try:
        NotificationService.send_notification(
            user_id=user.id,
            title="Security Alert: Password Reset",
            message="Your account password has been updated by an Administrator. If you did not request this change, contact system support immediately.",
            notification_type=NotificationType.SYSTEM,
            link="/profile"
        )
    except Exception:
        pass

    return jsonify({
        "success": True,
        "message": "User password reset successfully."
    }), 200


# 7. DELETE USER
@users_bp.delete("/<int:user_id>")
@roles_required("Administrator")
def delete_user(user_id):
    """
    Delete a user from the system.

    ---
    tags:
      - User Management
    summary: Delete user
    description: Deletes a user record. Admins cannot delete their own account.
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        required: true
        type: integer
        example: 2
    responses:
      200:
        description: User deleted successfully
      400:
        description: Cannot delete own account
      404:
        description: User not found
    """
    user = User.query.get(user_id)
    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    current_user_id = get_jwt_identity()
    try:
        current_user_id = int(current_user_id)
    except (TypeError, ValueError):
        pass

    if user.id == current_user_id:
        return jsonify({
            "success": False,
            "message": "You cannot delete your own account."
        }), 400

    deleted_user_info = {
        "email": user.email,
        "name": user.name,
        "role": user.role.name if user.role else None
    }
    user_id_deleted = user.id

    db.session.delete(user)
    db.session.commit()

    try:
        AuditService.log(
            action=AuditAction.DELETE,
            entity_type="User",
            entity_id=user_id_deleted,
            user_id=current_user_id,
            old_values=deleted_user_info
        )
    except Exception:
        pass

    return jsonify({
        "success": True,
        "message": "User deleted successfully."
    }), 200


# 8. GET ALL ROLES (With user count and permissions)
@users_bp.get("/roles")
@roles_required("Administrator")
def get_roles():
    """
    Get all system roles and their assigned permissions.
    """
    roles = Role.query.order_by(Role.id.asc()).all()
    roles_data = []
    for r in roles:
        user_count = User.query.filter_by(role_id=r.id).count()
        roles_data.append({
            "id": r.id,
            "name": r.name,
            "permissions": r.permissions or {},
            "user_count": user_count,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    
    return jsonify({
        "success": True,
        "count": len(roles_data),
        "roles": roles_data
    }), 200


# 9. UPDATE ROLE PERMISSIONS
@users_bp.put("/roles/<int:role_id>")
@roles_required("Administrator")
def update_role(role_id):
    """
    Update a role's permissions dictionary.
    """
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"success": False, "message": "Role not found."}), 404
    
    current_user_id = get_jwt_identity()
    try:
        current_user_id = int(current_user_id)
    except (TypeError, ValueError):
        pass

    old_permissions = role.permissions.copy() if isinstance(role.permissions, dict) else role.permissions
    old_name = role.name

    data = request.get_json() or {}
    if "permissions" in data:
        role.permissions = dict(data["permissions"])
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(role, "permissions")

    if "name" in data and role.name not in ["Administrator", "Advertiser"]: # Protect core role names
        role.name = data["name"]
    
    db.session.commit()

    try:
        AuditService.log(
            action=AuditAction.UPDATE,
            entity_type="Role",
            entity_id=role.id,
            user_id=current_user_id,
            old_values={"name": old_name, "permissions": old_permissions},
            new_values={"name": role.name, "permissions": role.permissions}
        )
    except Exception:
        pass

    return jsonify({
        "success": True,
        "message": f"Role '{role.name}' updated successfully.",
        "role": {
            "id": role.id,
            "name": role.name,
            "permissions": role.permissions
        }
    }), 200
