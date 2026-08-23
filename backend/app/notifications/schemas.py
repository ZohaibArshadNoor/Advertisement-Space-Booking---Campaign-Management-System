from marshmallow import Schema, fields, validate
from app.models.notification import NotificationType


class NotificationCreateSchema(Schema):
    """
    Schema for manually creating a notification (e.g. system broadcast).
    """
    user_id = fields.Integer(required=True)
    title = fields.String(required=True, validate=validate.Length(min=2, max=150))
    message = fields.String(required=True)
    type = fields.String(
        required=False,
        load_default=NotificationType.SYSTEM,
        validate=validate.OneOf(NotificationType.ALL)
    )
    link = fields.String(required=False, allow_none=True)