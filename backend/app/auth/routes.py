from flask import jsonify, request

from app.auth import auth_bp
from app.auth.schemas import RegistrationSchema
from app.extensions import db
from app.models.role import Role
from app.models.user import User


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