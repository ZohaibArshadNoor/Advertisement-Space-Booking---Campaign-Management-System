from marshmallow import Schema, fields, validate, validates, ValidationError


class AdvertiserSchema(Schema):
    """
    Validates advertiser company data.

    This schema is used when creating or updating
    an advertiser organization.
    """

    company_name = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=150
        )
    )

    business_registration_number = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )

    tax_number = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )

    email = fields.Email(
        required=False,
        allow_none=True
    )

    phone = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=30)
    )

    address = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=255)
    )

    city = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )

    country = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )


class AdvertiserUpdateSchema(Schema):
    """
    Validates advertiser data during updates.

    Unlike AdvertiserSchema, all fields are optional because
    an existing advertiser may only need one field updated.
    """

    company_name = fields.String(
        required=False,
        validate=validate.Length(
            min=2,
            max=150
        )
    )

    business_registration_number = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )

    tax_number = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )

    email = fields.Email(
        required=False,
        allow_none=True
    )

    phone = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=30)
    )

    address = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=255)
    )

    city = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )

    country = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )


class AdvertiserContactSchema(Schema):
    """
    Validates a contact person belonging to an advertiser.
    """

    name = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=150
        )
    )

    designation = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )

    email = fields.Email(
        required=True
    )

    phone = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=30)
    )

    is_primary = fields.Boolean(
        required=False,
        load_default=False
    )