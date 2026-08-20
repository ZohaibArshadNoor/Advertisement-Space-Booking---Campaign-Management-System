from decimal import Decimal

from marshmallow import (
    Schema,
    fields,
    validate,
    validates,
    ValidationError
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
            
            
            
            
            
            
            
            