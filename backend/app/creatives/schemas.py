from marshmallow import Schema, fields, validate
from app.models.creative import MediaStatus


class MediaStatusUpdateSchema(Schema):
    status = fields.String(
        required=True,
        validate=validate.OneOf([MediaStatus.APPROVED, MediaStatus.REJECTED])
    )
    rejection_reason = fields.String(required=False, allow_none=True)
