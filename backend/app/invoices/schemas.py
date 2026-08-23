from marshmallow import Schema, fields, validate, ValidationError
from app.models.payment import InvoiceStatus


class InvoiceCreateSchema(Schema):
    campaign_id = fields.Integer(required=True)
    tax_rate = fields.Decimal(required=False, as_string=True, places=2, load_default="0.00")
    due_date = fields.Date(required=False, allow_none=True)
    advertiser_id = fields.Integer(required=False, allow_none=True)


class InvoiceStatusUpdateSchema(Schema):
    status = fields.String(
        required=True,
        validate=validate.OneOf(
            InvoiceStatus.ALL,
            error="Status must be one of: {choices}"
        )
    )