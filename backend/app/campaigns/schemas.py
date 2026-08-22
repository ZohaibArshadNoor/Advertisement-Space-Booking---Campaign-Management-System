from marshmallow import (
    Schema,
    fields,
    validate,
    validates_schema,
    ValidationError
)

from app.models.campaign import CampaignStatus


class CampaignCreateSchema(Schema):
    """
    Validates data when creating a new campaign.
    """

    name = fields.String(
        required=True,
        validate=validate.Length(min=2, max=255)
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    start_date = fields.Date(
        required=False,
        allow_none=True
    )

    end_date = fields.Date(
        required=False,
        allow_none=True
    )

    budget = fields.Decimal(
        required=False,
        allow_none=True,
        as_string=True,
        places=2
    )

    advertiser_id = fields.Integer(
        required=False,
        allow_none=True
    )

    @validates_schema
    def validate_dates(self, data, **kwargs):
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


class CampaignUpdateSchema(Schema):
    """
    Validates data when updating campaign details.
    """

    name = fields.String(
        required=False,
        validate=validate.Length(min=2, max=255)
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    start_date = fields.Date(
        required=False,
        allow_none=True
    )

    end_date = fields.Date(
        required=False,
        allow_none=True
    )

    budget = fields.Decimal(
        required=False,
        allow_none=True,
        as_string=True,
        places=2
    )

    @validates_schema
    def validate_dates(self, data, **kwargs):
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


class CampaignStatusUpdateSchema(Schema):
    """
    Validates data when updating campaign status.
    """

    status = fields.String(
        required=True,
        validate=validate.OneOf(
            CampaignStatus.ALL,
            error="Status must be one of: {choices}"
        )
    )