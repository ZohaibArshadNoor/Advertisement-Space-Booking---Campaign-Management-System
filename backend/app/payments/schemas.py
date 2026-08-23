from marshmallow import Schema, fields, validate, ValidationError
from app.models.payment import PaymentMethod, PaymentStatus


class PaymentCreateSchema(Schema):
    invoice_id = fields.Integer(required=True)
    amount = fields.Decimal(required=True, as_string=True, places=2)
    payment_method = fields.String(
        required=False,
        load_default=PaymentMethod.BANK_TRANSFER,
        validate=validate.OneOf(PaymentMethod.ALL)
    )
    transaction_reference = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )


class PaymentStatusUpdateSchema(Schema):
    status = fields.String(
        required=True,
        validate=validate.OneOf(PaymentStatus.ALL)
    )