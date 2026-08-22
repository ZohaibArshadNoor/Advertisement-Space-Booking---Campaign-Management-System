from marshmallow import (
    Schema,
    fields,
    validate,
    validates_schema,
    ValidationError
)

from app.models.booking import BookingStatus


class BookingCreateSchema(Schema):
    """
    Validates incoming request payload when creating a new booking.
    """

    space_id = fields.Integer(
        required=True
    )

    advertiser_id = fields.Integer(
        required=False,
        allow_none=True
    )

    start_date = fields.Date(
        required=True
    )

    end_date = fields.Date(
        required=True
    )

    notes = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=500)
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


class BookingStatusUpdateSchema(Schema):
    """
    Validates request payload when updating booking workflow status.
    """

    status = fields.String(
        required=True,
        validate=validate.OneOf(
            BookingStatus.ALL,
            error="Status must be one of: {choices}"
        )
    )