import os

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.common.email_service import (
    generate_verification_token,
    verify_token,
    send_verification_email
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

registration_schema = RegistrationSchema()


@auth_bp.post("/register")
def register():
    """
    Register a new advertiser account.

    ---
    tags:
      - Authentication
    summary: Register a new advertiser
    description: Creates a new advertiser account. Public registration always assigns the Advertiser role.
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
        description: Account created successfully
      400:
        description: Invalid request data
      409:
        description: Email already registered
      500:
        description: Server error
    """

    # Read JSON submitted by the client.
    data = request.get_json(silent=True)

    # Reject requests that don't contain valid JSON.
    if not data:
        return jsonify({
            "success": False,
            "message": "Request body must contain JSON data."
        }), 400

    # Validate and deserialize the request data.
    errors = registration_schema.validate(data)

    if errors:
        return jsonify({
            "success": False,
            "errors": errors
        }), 400

    # Convert validated input into Python data.
    validated_data = registration_schema.load(data)

    # Normalize the email address.
    #
    # This prevents users from accidentally creating accounts
    # such as User@example.com and user@example.com.
    email = validated_data["email"].strip().lower()

    # Check whether the email is already registered.
    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:
        return jsonify({
            "success": False,
            "message": "An account with this email already exists."
        }), 409

    # Check whether the requested role exists.
    role = Role.query.filter_by(
        name="Advertiser"
    ).first()

    if role is None:
        return jsonify({
            "success": False,
            "message": "Default Advertiser role is not configured."
        }), 500


    # Create the user.
    user = User(
        name=validated_data["name"].strip(),
        email=email,
        role_id=role.id
    )

    # Hash the password before storing it.
    user.set_password(
        validated_data["password"]
    )

    # Add the user to the database session.
    db.session.add(user)

    try:
        # Save the user.
        db.session.commit()

    except Exception:
        # Undo the transaction if something goes wrong.
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to create the account."
        }), 500


    # Generate a verification token and send the verification email.
    token = generate_verification_token(user.email)
    send_verification_email(
        user.email,
        user.name,
        token
    )


    # Return only safe user information.
    return jsonify({
        "success": True,
        "message": "Registration successful! Please check your email to verify your account.",
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

    try:
        # Verify the token against Google's public certs
        id_info = id_token.verify_oauth2_token(
            token_str,
            google_requests.Request(),
            google_client_id
        )

        email = id_info.get("email")
        name = id_info.get("name", email.split("@")[0])

        if not email:
            return jsonify({"error": "Unable to retrieve email from Google token"}), 400

        # Query existing user or create a new Advertiser
        user = User.query.filter_by(email=email).first()

        if not user:
            advertiser_role = Role.query.filter_by(name="Advertiser").first()
            user = User(
                email=email,
                name=name,
                role_id=advertiser_role.id if advertiser_role else 6,
                is_active=True,
                is_verified=True # Google authenticated emails are pre-verified
            )
            user.set_password(os.urandom(16).hex()) # Secure random password
            db.session.add(user)
            db.session.commit()
        else:
            # Mark existing user as verified if they sign in with Google
            if not getattr(user, 'is_verified', True):
                user.is_verified = True
                db.session.commit()

        # Generate JWT session
        identity = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.name if user.role else "Advertiser"
        }
        access_token = create_access_token(identity=identity)
        refresh_token = create_refresh_token(identity=identity)

        return jsonify({
            "status": "success",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict()
        }), 200

    except ValueError as e:
        return jsonify({"error": f"Invalid Google token: {str(e)}"}), 401
    except Exception as e:
        return jsonify({"error": f"Google authentication failed: {str(e)}"}), 500

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

    user.is_verified = True
    user.is_active = True
    db.session.commit()

    # Generate login tokens
    identity = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role.name if user.role else "Advertiser"
    }
    access_token = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)

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
        description: Account is inactive
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

    # Normalize the email in exactly the same way
    # we did during registration.
    email = validated_data["email"].strip().lower()

    # Find the user.
    user = User.query.filter_by(
        email=email
    ).first()

    # Don't reveal whether the email exists.
    #
    # This prevents attackers from using the login endpoint
    # to discover registered email addresses.
    if user is None or not user.check_password(
        validated_data["password"]
    ):
        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        }), 401

    # Prevent inactive accounts from logging in.
    if not user.is_active:
        return jsonify({
            "success": False,
            "message": "This account is inactive."
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
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.name,
            "is_active": user.is_active
        }
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
    user_id = get_jwt_identity()

    # Load the actual user from PostgreSQL.
    user = db.session.get(User, int(user_id))

    # A token may still exist even if the corresponding
    # database user has subsequently been deleted.
    if user is None:
        return jsonify({
            "success": False,
            "message": "User account no longer exists."
        }), 404

    return jsonify({
        "success": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.name,
            "is_active": user.is_active
        }
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






    