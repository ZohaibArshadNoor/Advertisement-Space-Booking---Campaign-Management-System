from marshmallow import Schema, fields, validate


# Schema used when an Administrator creates a new user.
# All fields defined here are required unless specified otherwise.
class CreateUserSchema(Schema):
    """
    Validates user creation payload by Administrator.
    """

    # User's display/full name.
    # Must contain between 2 and 120 characters.
    name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=120)
    )

    # User's email address.
    # Marshmallow automatically validates the email format.
    email = fields.Email(required=True)

    # User's password.
    # load_only=True prevents the password from appearing in serialized responses.
    # Password must be between 8 and 128 characters.
    password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=8, max=128)
    )

    # ID of the role assigned to the user.
    role_id = fields.Int(required=True)


# Schema used when an Administrator updates an existing user.
# All fields are optional because the Administrator may update only specific fields.
class UpdateUserSchema(Schema):
    """
    Validates user update payload.
    """

    # Updated user name.
    name = fields.Str(validate=validate.Length(min=2, max=120))

    # Updated email address.
    email = fields.Email()

    # Updated role ID.
    role_id = fields.Int()


# Schema used to activate or deactivate a user account.
class UpdateUserStatusSchema(Schema):
    """
    Validates account activation/deactivation payload.
    """

    # True = account active, False = account deactivated.
    is_active = fields.Boolean(required=True)


# Schema used when an Administrator resets a user's password.
class AdminResetPasswordSchema(Schema):
    """
    Validates admin password reset payload.
    """

    # New password must contain between 8 and 128 characters.
    new_password = fields.Str(
        required=True,
        validate=validate.Length(min=8, max=128)
    )