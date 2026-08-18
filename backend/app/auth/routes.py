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
    create_refresh_token
)

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
    