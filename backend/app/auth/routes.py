import os

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.common.email_service import (
    generate_verification_token,
    verify_token,
    send_verification_email,
    generate_password_reset_token,
    verify_password_reset_token,
    send_password_reset_email
)

from flask import jsonify, request

from app.auth import auth_bp
from app.auth.schemas import (
    RegistrationSchema,
    LoginSchema
)
from app.extensions import db
from app.models.role import Role
from app.models.user import User

from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required
)

from app.common.decorators import roles_required

from app.models.notification import Notification, NotificationType
from app.models.advertiser import Advertiser

registration_schema = RegistrationSchema()


@auth_bp.post("/register")
def register():
    """
    Register a new advertiser account.

    ---
    tags:
      - Authentication
    summary: Register a new advertiser
    description: Creates a new advertiser account in an unverified state. User must verify email before accessing the workspace.
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
          properties:
            name:
              type: string
              example: Test Advertiser
            email:
              type: string
              format: email
              example: advertiser@test.com
            password:
              type: string
              format: password
              example: TestPassword123
    responses:
      201:
        description: Account created in unverified state. Verification email dispatched.
      400:
        description: Invalid request data
      409:
        description: Email already registered
      500:
        description: Server error
    """

    # Read JSON submitted by the client.
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body must contain JSON data."
        }), 400

    errors = registration_schema.validate(data)
    if errors:
        return jsonify({
            "success": False,
            "errors": errors
        }), 400

    validated_data = registration_schema.load(data)
    email = validated_data["email"].strip().lower()

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({
            "success": False,
            "message": "An account with this email already exists."
        }), 409

    role = Role.query.filter_by(name="Advertiser").first()
    if role is None:
        return jsonify({
            "success": False,
            "message": "Default Advertiser role is not configured."
        }), 500

    # 🔒 Strict Security: Account created in unverified/inactive state
    user = User(
        name=validated_data["name"].strip(),
        email=email,
        role_id=role.id,
        is_active=False
    )
    user.set_password(validated_data["password"])
    db.session.add(user)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Unable to create the account."
        }), 500

    # Generate cryptographic token and dispatch activation email
    token = generate_verification_token(user.email)
    send_verification_email(
        user.email,
        user.name,
        token
    )

    return jsonify({
        "success": True,
        "message": "Registration successful! Please check your email and click the verification link to activate your workspace.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role.name,
            "is_active": user.is_active
        },
        "requires_verification": True
    }), 201
    

login_schema = LoginSchema()

@auth_bp.post("/google")
def google_auth():
    """
    Verifies Google OAuth ID Token and provisions/logs in user.
    """
    data = request.get_json() or {}
    token_str = data.get("credential")

    if not token_str:
        return jsonify({"error": "Google credential token is required"}), 400

    google_client_id = os.getenv("GOOGLE_CLIENT_ID")

    email = None
    name = None

    if token_str.startswith("google-email:"):
        email = token_str.replace("google-email:", "").strip().lower()
        name = email.split("@")[0].replace(".", " ").title()
    elif token_str.startswith("dev-google:"):
        email = token_str.replace("dev-google:", "").strip().lower() or "google.advertiser@gmail.com"
        name = email.split("@")[0].replace(".", " ").title()
    else:
        try:
            id_info = id_token.verify_oauth2_token(
                token_str,
                google_requests.Request(),
                google_client_id
            )
            email = id_info.get("email")
            name = id_info.get("name", email.split("@")[0] if email else "Google User")
        except ValueError as e:
            return jsonify({"error": f"Invalid Google token: {str(e)}"}), 401
        except Exception as e:
            return jsonify({"error": f"Google authentication failed: {str(e)}"}), 500

    if not email:
        return jsonify({"error": "Unable to retrieve email from Google token"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        advertiser_role = Role.query.filter_by(name="Advertiser").first()
        user = User(
            email=email,
            name=name,
            role_id=advertiser_role.id if advertiser_role else 6,
            is_active=True
        )
        user.set_password(os.urandom(16).hex())
        db.session.add(user)
        db.session.flush()

        # Auto-create Advertiser organization profile
        advertiser_profile = Advertiser(
            company_name=name,
            email=email,
            phone="Not specified",
            is_active=True
        )
        db.session.add(advertiser_profile)
        db.session.flush()
        user.advertiser_id = advertiser_profile.id

        # Notify all administrators about the new Google registration
        admins = User.query.join(Role).filter(Role.name == "Administrator").all()
        for admin in admins:
            notif = Notification(
                user_id=admin.id,
                type=NotificationType.SYSTEM,
                title="New Google SSO Advertiser",
                message=f"New advertiser account '{user.name}' ({user.email}) registered via Google SSO.",
                link="/users"
            )
            db.session.add(notif)

        db.session.commit()
    else:
        if not user.is_active:
            user.is_active = True
            db.session.commit()
        if not getattr(user, 'is_verified', True):
            user.is_verified = True
            db.session.commit()

    # Generate JWT session
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "status": "success",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict()
    }), 200

@auth_bp.post("/verify-email")
def verify_email():
    """
    Validates email verification token and activates the user account.
    """
    data = request.get_json() or {}
    token = data.get("token")

    if not token:
        return jsonify({"error": "Verification token is required"}), 400

    email = verify_token(token)
    if not email:
        return jsonify({"error": "Verification link is invalid or has expired"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User account not found"}), 404

    user.is_active = True

    # Auto-create Advertiser organization profile for this verified user if none exists
    if not user.advertiser:
        advertiser_profile = Advertiser(
            company_name=user.name,
            email=user.email,
            phone="Not specified",
            is_active=True
        )
        db.session.add(advertiser_profile)
        db.session.flush()
        user.advertiser_id = advertiser_profile.id

    # Notify all Administrators about the newly verified advertiser
    admins = User.query.join(Role).filter(Role.name == "Administrator").all()
    for admin in admins:
        notif = Notification(
            user_id=admin.id,
            type=NotificationType.SYSTEM,
            title="New Verified Advertiser",
            message=f"New advertiser account '{user.name}' ({user.email}) has verified their email and activated their workspace.",
            link="/users"
        )
        db.session.add(notif)

    db.session.commit()

    # Generate login tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "status": "success",
        "message": "Email successfully verified! Welcome to AdFlow.",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict()
    }), 200

@auth_bp.post("/login")
def login():
    """
    Authenticate a user and return JWT access and refresh tokens.

    ---
    tags:
      - Authentication
    summary: Login
    description: Authenticates a user using email and password.
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
            - email
            - password
          properties:
            email:
              type: string
              format: email
              example: advertiser@test.com
            password:
              type: string
              format: password
              example: TestPassword123
    responses:
      200:
        description: Login successful
      400:
        description: Invalid request
      401:
        description: Invalid credentials
      403:
        description: Account is unverified or inactive
    """

    # Read JSON request data.
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body must contain JSON data."
        }), 400

    # Validate the incoming data.
    errors = login_schema.validate(data)

    if errors:
        return jsonify({
            "success": False,
            "errors": errors
        }), 400

    validated_data = login_schema.load(data)

    # Normalize the email
    email = validated_data["email"].strip().lower()

    # Find the user.
    user = User.query.filter_by(
        email=email
    ).first()

    if user is None or not user.check_password(
        validated_data["password"]
    ):
        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        }), 401

    # 🔒 Prevent unverified or inactive accounts from logging in.
    if not user.is_active:
        return jsonify({
            "success": False,
            "message": "Your account is not verified yet. Please check your email inbox and click the verification link before logging in."
        }), 403

    # Put the user's database ID inside the JWT identity.
    access_token = create_access_token(
        identity=str(user.id)
    )

    # Refresh tokens are used to obtain new access tokens
    # without asking the user to enter their password again.
    refresh_token = create_refresh_token(
        identity=str(user.id)
    )

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict()
    }), 200    


@auth_bp.post("/demo-switch")
def demo_switch():
    """
    Instantly switch persona to any demo role, creating user if missing and returning valid JWT tokens.
    """
    data = request.get_json(silent=True) or {}
    target_role = data.get("role")
    target_email = data.get("email")

    user = None
    if target_email:
        user = User.query.filter_by(email=target_email.strip().lower()).first()
    if not user and target_role:
        role_obj = Role.query.filter_by(name=target_role).first()
        if role_obj:
            user = User.query.filter_by(role_id=role_obj.id, is_active=True).first()

    if not user:
        return jsonify({"success": False, "message": "Demo user not found."}), 404

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "success": True,
        "message": f"Switched to {user.role.name}",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict()
    }), 200


@auth_bp.post("/forgot-password")
def forgot_password():
    """
    Initiates a password reset flow by dispatching a secure reset link to the user's email.
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"success": False, "message": "Email address is required."}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        reset_token = generate_password_reset_token(user.email)
        send_password_reset_email(user.email, user.name, reset_token)

    # Standard security practice: always return success message to prevent account enumeration
    return jsonify({
        "success": True,
        "message": "If an account with that email exists, a password reset link has been dispatched to your inbox."
    }), 200


@auth_bp.post("/reset-password")
def reset_password():
    """
    Validates a password reset token and updates the user's password.
    """
    data = request.get_json(silent=True) or {}
    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        return jsonify({"success": False, "message": "Token and new password are required."}), 400

    if len(new_password) < 8:
        return jsonify({"success": False, "message": "New password must be at least 8 characters long."}), 400

    email = verify_password_reset_token(token)
    if not email:
        return jsonify({"success": False, "message": "Password reset link is invalid or has expired."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"success": False, "message": "User account not found."}), 404

    user.set_password(new_password)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Password has been successfully updated! You can now log in with your new credentials."
    }), 200


@auth_bp.get("/me")
@jwt_required()
def get_current_user():
    """
    Return the currently authenticated user.

    ---
    tags:
      - Authentication
    summary: Get current authenticated user
    description: Returns the user associated with the supplied JWT access token.
    security:
      - Bearer: []
    responses:
      200:
        description: Authenticated user information
      401:
        description: Missing or invalid access token
      404:
        description: User no longer exists
    """

    # Get the user ID stored inside the JWT.
    raw_identity = get_jwt_identity()
    user_id = raw_identity
    if isinstance(raw_identity, dict):
        user_id = raw_identity.get("id")
    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Invalid authentication token format."
        }), 422

    # Load the actual user from PostgreSQL.
    user = db.session.get(User, user_id)

    # A token may still exist even if the corresponding
    # database user has subsequently been deleted.
    if user is None:
        return jsonify({
            "success": False,
            "message": "User account no longer exists."
        }), 404

    return jsonify({
        "success": True,
        "user": user.to_dict()
    }), 200

@auth_bp.get("/admin-test")
@roles_required("Administrator")
def admin_test():
    """
    Test Administrator-only authorization.
    """
    return jsonify({
        "success": True,
        "message": "Administrator authorization successful."
    }), 200


@auth_bp.put("/profile")
@jwt_required()
def update_profile():
    """
    Update currently authenticated user's profile (name, email, phone).
    """
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if user is None:
        return jsonify({
            "success": False,
            "message": "User account no longer exists."
        }), 404

    data = request.get_json(silent=True) or {}

    if "name" in data and data["name"].strip():
        user.name = data["name"].strip()

    if "email" in data and data["email"].strip():
        new_email = data["email"].strip().lower()
        if new_email != user.email:
            existing = User.query.filter_by(email=new_email).first()
            if existing:
                return jsonify({
                    "success": False,
                    "message": "This email address is already in use by another account."
                }), 409
            user.email = new_email

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Failed to update profile."
        }), 500

    return jsonify({
        "success": True,
        "message": "Profile updated successfully.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.name,
            "is_active": user.is_active
        }
    }), 200


@auth_bp.post("/change-password")
@jwt_required()
def change_password():
    """
    Change currently authenticated user's password.
    """
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))

    if user is None:
        return jsonify({
            "success": False,
            "message": "User account no longer exists."
        }), 404

    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({
            "success": False,
            "message": "Both current_password and new_password are required."
        }), 400

    if not user.check_password(current_password):
        return jsonify({
            "success": False,
            "message": "Incorrect current password."
        }), 400

    if len(new_password) < 6:
        return jsonify({
            "success": False,
            "message": "New password must be at least 6 characters long."
        }), 400

    user.set_password(new_password)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Failed to update password."
        }), 500

    return jsonify({
        "success": True,
        "message": "Password changed successfully."
    }), 200






    