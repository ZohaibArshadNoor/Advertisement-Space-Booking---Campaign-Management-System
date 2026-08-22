from decimal import Decimal

from marshmallow import (
    Schema,
    fields,
    validate,
    validates,
    ValidationError,
    validates_schema
)

class LocationCreateSchema(Schema):
    """
    Validates data when creating a new advertising location.

    A location represents a physical or geographic place where
    one or more advertising spaces can exist.
    """

    name = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=150
        )
    )

    address = fields.String(
        required=True,
        validate=validate.Length(
            min=5,
            max=255
        )
    )

    city = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=100
        )
    )

    latitude = fields.Decimal(
        required=False,
        allow_none=True,
        as_string=True,
        places=7
    )

    longitude = fields.Decimal(
        required=False,
        allow_none=True,
        as_string=True,
        places=7
    )

    @validates("latitude")
    def validate_latitude(self, value, **kwargs):
        """
        Ensures latitude is geographically valid.

        Latitude must be between -90 and 90.
        """

        if value is not None and not (
            Decimal("-90") <= value <= Decimal("90")
        ):
            raise ValidationError(
                "Latitude must be between -90 and 90."
            )

    @validates("longitude")
    def validate_longitude(self, value, **kwargs):
        """
        Ensures longitude is geographically valid.

        Longitude must be between -180 and 180.
        """

        if value is not None and not (
            Decimal("-180") <= value <= Decimal("180")
        ):
            raise ValidationError(
                "Longitude must be between -180 and 180."
            )


class LocationUpdateSchema(Schema):
    """
    Validates data when updating a location.

    All fields are optional because an update may modify
    only one or more specific fields.
    """

    name = fields.String(
        required=False,
        validate=validate.Length(
            min=2,
            max=150
        )
    )

    address = fields.String(
        required=False,
        validate=validate.Length(
            min=5,
            max=255
        )
    )

    city = fields.String(
        required=False,
        validate=validate.Length(
            min=2,
            max=100
        )
    )

    latitude = fields.Decimal(
        required=False,
        allow_none=True,
        as_string=True,
        places=7
    )

    longitude = fields.Decimal(
        required=False,
        allow_none=True,
        as_string=True,
        places=7
    )

    @validates("latitude")
    def validate_latitude(self, value, **kwargs):
        """
        Ensures latitude is geographically valid.
        """

        if value is not None and not (
            Decimal("-90") <= value <= Decimal("90")
        ):
            raise ValidationError(
                "Latitude must be between -90 and 90."
            )

    @validates("longitude")
    def validate_longitude(self, value, **kwargs):
        """
        Ensures longitude is geographically valid.
        """

        if value is not None and not (
            Decimal("-180") <= value <= Decimal("180")
        ):
            raise ValidationError(
                "Longitude must be between -180 and 180."
            )
            

class SpaceCategoryCreateSchema(Schema):
    """
    Validates data when creating a new advertising space category.

    Examples:
    - Billboard
    - Digital Screen
    - Transit Advertisement
    - Website Advertisement
    """

    name = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=100
        )
    )


class SpaceCategoryUpdateSchema(Schema):
    """
    Validates data when updating an advertising space category.

    The name is optional because this schema is used for updates.
    """

    name = fields.String(
        required=False,
        validate=validate.Length(
            min=2,
            max=100
        )
    )            
            
            
class AdvertisingSpaceCreateSchema(Schema):
    """
    Validates data when creating an advertising space.

    Every advertising space must belong to:
    1. A space category.
    2. A location.
    """

    category_id = fields.Integer(
        required=True,
        strict=True
    )

    location_id = fields.Integer(
        required=True,
        strict=True
    )

    name = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=150
        )
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    dimensions = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )

    base_rate = fields.Decimal(
        required=True,
        as_string=True,
        places=2
    )

    @validates("base_rate")
    def validate_base_rate(self, value, **kwargs):
        """
        Ensures that the base rate is greater than zero.
        """

        if value <= 0:
            raise ValidationError(
                "Base rate must be greater than zero."
            )


class AdvertisingSpaceUpdateSchema(Schema):
    """
    Validates data when updating an advertising space.

    All fields are optional because an update may change
    only one or more fields.
    """

    category_id = fields.Integer(
        required=False,
        strict=True
    )

    location_id = fields.Integer(
        required=False,
        strict=True
    )

    name = fields.String(
        required=False,
        validate=validate.Length(
            min=2,
            max=150
        )
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    dimensions = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )

    base_rate = fields.Decimal(
        required=False,
        as_string=True,
        places=2
    )

    @validates("base_rate")
    def validate_base_rate(self, value, **kwargs):
        """
        Ensures that the base rate is greater than zero.
        """

        if value is not None and value <= 0:
            raise ValidationError(
                "Base rate must be greater than zero."
            )


class AdvertisingSpaceStatusSchema(Schema):
    """
    Validates data when changing the active status of an advertising space.
    """

    is_active = fields.Boolean(
        required=True
    )
    

class RateCardCreateSchema(Schema):
    """
    Validates data when creating a new rate card.

    A rate card defines the price of an advertising space
    for a specific period of time.
    """

    rate_type = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=50
        )
    )

    price = fields.Decimal(
        required=True,
        as_string=True,
        places=2,
        validate=validate.Range(
            min=0.01
        )
    )

    effective_from = fields.Date(
        required=True
    )

    effective_to = fields.Date(
        required=False,
        allow_none=True
    )

    @validates_schema
    def validate_dates(self, data, **kwargs):
        """
        Ensures that the end date is not earlier than
        the start date.
        """

        effective_from = data.get("effective_from")
        effective_to = data.get("effective_to")

        if (
            effective_from
            and effective_to
            and effective_to < effective_from
        ):
            raise ValidationError(
                {
                    "effective_to": [
                        "effective_to cannot be earlier than effective_from."
                    ]
                }
            )


class RateCardUpdateSchema(Schema):
    """
    Validates data when updating an existing rate card.

    All fields are optional because an update may modify
    only one or several fields.
    """

    rate_type = fields.String(
        required=False,
        validate=validate.Length(
            min=2,
            max=50
        )
    )

    price = fields.Decimal(
        required=False,
        as_string=True,
        places=2,
        validate=validate.Range(
            min=0.01
        )
    )

    effective_from = fields.Date(
        required=False
    )

    effective_to = fields.Date(
        required=False,
        allow_none=True
    )

    @validates_schema
    def validate_dates(self, data, **kwargs):
        """
        Validates dates when both dates are supplied.

        More complete validation against the existing
        database record will also happen in the route.
        """

        effective_from = data.get("effective_from")
        effective_to = data.get("effective_to")

        if (
            effective_from
            and effective_to
            and effective_to < effective_from
        ):
            raise ValidationError(
                {
                    "effective_to": [
                        "effective_to cannot be earlier than effective_from."
                    ]
                }
            )








