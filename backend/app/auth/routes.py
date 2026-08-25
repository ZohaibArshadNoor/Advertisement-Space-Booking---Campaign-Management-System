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

    # Return only safe user information.
    return jsonify({
        "success": True,
        "message": "Account created successfully.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role.name,
            "is_active": user.is_active
        }
    }), 201
    

login_schema = LoginSchema()


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






    