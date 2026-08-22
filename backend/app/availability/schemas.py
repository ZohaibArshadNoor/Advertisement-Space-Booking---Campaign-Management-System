from marshmallow import (
    Schema,
    fields,
    validates_schema,
    ValidationError
)


class SpaceAvailabilityCreateSchema(Schema):
    """
    Validates data when creating an availability period or booking block.
    """
    start_date = fields.Date(
        required=True
    )

    end_date = fields.Date(
        required=True
    )

    is_booked = fields.Boolean(
        required=False,
        load_default=True
    )

    @validates_schema
    def validate_dates(self, data, **kwargs):
        """
        Ensures end_date is not earlier than start_date.
        """
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date and end_date and end_date < start_date:
            raise ValidationError(
                {
                    "end_date": [
                        "end_date cannot be earlier than start_date."
                    ]
                }
            )


class CheckAvailabilityQuerySchema(Schema):
    """
    Validates query parameters when checking if a space is available for dates.
    """
    start_date = fields.Date(
        required=True
    )

    end_date = fields.Date(
        required=True
    )

    @validates_schema
    def validate_dates(self, data, **kwargs):
        """
        Ensures end_date is not earlier than start_date.
        """
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date and end_date and end_date < start_date:
            raise ValidationError(
                {
                    "end_date": [
                        "end_date cannot be earlier than start_date."
                    ]
                }
            )
