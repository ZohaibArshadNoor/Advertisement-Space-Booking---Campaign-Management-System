from decimal import Decimal

from marshmallow import (
    Schema,
    fields,
    validate,
    validates,
    ValidationError,
    validates_schema,
    EXCLUDE
)

class LocationCreateSchema(Schema):
    """
    Validates data when creating a new advertising location.
    """
    class Meta:
        unknown = EXCLUDE

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
        if value is not None and not (
            Decimal("-90") <= value <= Decimal("90")
        ):
            raise ValidationError(
                "Latitude must be between -90 and 90."
            )

    @validates("longitude")
    def validate_longitude(self, value, **kwargs):
        if value is not None and not (
            Decimal("-180") <= value <= Decimal("180")
        ):
            raise ValidationError(
                "Longitude must be between -180 and 180."
            )


class LocationUpdateSchema(Schema):
    """
    Validates data when updating a location.
    """
    class Meta:
        unknown = EXCLUDE

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
        if value is not None and not (
            Decimal("-90") <= value <= Decimal("90")
        ):
            raise ValidationError(
                "Latitude must be between -90 and 90."
            )

    @validates("longitude")
    def validate_longitude(self, value, **kwargs):
        if value is not None and not (
            Decimal("-180") <= value <= Decimal("180")
        ):
            raise ValidationError(
                "Longitude must be between -180 and 180."
            )


class SpaceCategoryCreateSchema(Schema):
    """
    Validates data when creating a new advertising space category.
    """
    class Meta:
        unknown = EXCLUDE

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
    """
    class Meta:
        unknown = EXCLUDE

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
    """
    class Meta:
        unknown = EXCLUDE

    category_id = fields.Integer(
        required=False,
        allow_none=True
    )

    location_id = fields.Integer(
        required=False,
        allow_none=True
    )

    category_name = fields.String(
        required=False,
        allow_none=True
    )

    location_name = fields.String(
        required=False,
        allow_none=True
    )

    city = fields.String(
        required=False,
        allow_none=True
    )

    address = fields.String(
        required=False,
        allow_none=True
    )

    name = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=150
        )
    )

    code = fields.String(
        required=False,
        allow_none=True
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

    resolution = fields.String(
        required=False,
        allow_none=True
    )

    traffic_count = fields.String(
        required=False,
        allow_none=True
    )

    base_rate = fields.Decimal(
        required=False,
        as_string=True,
        places=2
    )

    daily_rate = fields.Decimal(
        required=False,
        as_string=True,
        places=2
    )

    is_active = fields.Boolean(
        required=False,
        load_default=True,
        dump_default=True
    )

    @validates_schema
    def validate_rates(self, data, **kwargs):
        rate = data.get("base_rate") or data.get("daily_rate")
        if rate is None:
            raise ValidationError("Base rate (or daily rate) is required.", field_name="base_rate")
        if Decimal(str(rate)) <= 0:
            raise ValidationError("Base rate must be greater than zero.", field_name="base_rate")


class AdvertisingSpaceUpdateSchema(Schema):
    """
    Validates data when updating an advertising space.
    """
    class Meta:
        unknown = EXCLUDE

    category_id = fields.Integer(
        required=False,
        allow_none=True
    )

    location_id = fields.Integer(
        required=False,
        allow_none=True
    )

    name = fields.String(
        required=False,
        validate=validate.Length(
            min=2,
            max=150
        )
    )

    code = fields.String(
        required=False,
        allow_none=True
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

    daily_rate = fields.Decimal(
        required=False,
        as_string=True,
        places=2
    )

    is_active = fields.Boolean(
        required=False
    )

    @validates("base_rate")
    def validate_base_rate(self, value, **kwargs):
        if value is not None and value <= 0:
            raise ValidationError("Base rate must be greater than zero.")

    @validates("daily_rate")
    def validate_daily_rate(self, value, **kwargs):
        if value is not None and value <= 0:
            raise ValidationError("Daily rate must be greater than zero.")


class AdvertisingSpaceStatusSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    is_active = fields.Boolean(
        required=True
    )


class RateCardCreateSchema(Schema):
    """
    Validates data when creating a new rate card.
    """
    class Meta:
        unknown = EXCLUDE

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
    """
    class Meta:
        unknown = EXCLUDE

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
