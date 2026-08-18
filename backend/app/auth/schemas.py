from marshmallow import Schema, fields, validate


class RegistrationSchema(Schema):
    """
    Validates public advertiser registration data.
    """

    name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=120)
    )

    email = fields.Email(
        required=True
    )

    password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=8, max=128)
    )
    
class LoginSchema(Schema):
    """
    Validates login credentials.
    """

    email = fields.Email(
        required=True
    )

    password = fields.Str(
        required=True,
        load_only=True
    )