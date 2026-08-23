from marshmallow import Schema, fields, validates_schema, ValidationError


class DateRangeReportQuerySchema(Schema):
    """
    Validates optional date filter query parameters for reports.
    """
    start_date = fields.Date(required=False, allow_none=True)
    end_date = fields.Date(required=False, allow_none=True)

    @validates_schema
    def validate_dates(self, data, **kwargs):
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date and end_date and end_date < start_date:
            raise ValidationError(
                {"end_date": ["end_date cannot be earlier than start_date."]}
            )
