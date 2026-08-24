from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError

from app.notifications import notifications_bp
from app.notifications.schemas import NotificationCreateSchema
from app.services.notification_service import NotificationService
from app.common.decorators import roles_required
from app.models.notification import Notification
from app.extensions import db

notification_create_schema = NotificationCreateSchema()


def notification_to_dict(notification):
    """
    Converts a Notification database object into JSON-safe dictionary.
    """
    return {
        "id": notification.id,
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "link": notification.link,
        "is_read": notification.is_read,
        "created_at": (
            notification.created_at.isoformat()
            if notification.created_at
            else None
        )
    }


# 1. LIST NOTIFICATIONS
@notifications_bp.get("")
@jwt_required()
def get_notifications():
    """
    Get paginated notifications for current authenticated user.
    ---
    tags:
      - Notification Management
    summary: List current user's notifications
    security:
      - Bearer: []
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 20
      - name: unread_only
        in: query
        type: boolean
        default: false
      - name: type
        in: query
        type: string
        enum: [BOOKING, CAMPAIGN, INVOICE, PAYMENT, SYSTEM]
      - name: search
        in: query
        type: string
        description: Keyword search on notification title or message.
      - name: start_date
        in: query
        type: string
        format: date
      - name: end_date
        in: query
        type: string
        format: date
      - name: sort_by
        in: query
        type: string
        enum: [created_at, title, type]
        default: created_at
      - name: sort_order
        in: query
        type: string
        enum: [asc, desc]
        default: desc
    responses:
      200:
        description: Notifications retrieved successfully.
      401:
        description: Authentication required.
    """
    current_user_id = int(get_jwt_identity())
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    unread_only = request.args.get("unread_only", "false").lower() == "true"
    notification_type = request.args.get("type")
    search = request.args.get("search")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    sort_by = request.args.get("sort_by", default="created_at")
    sort_order = request.args.get("sort_order", default="desc")

    if page < 1:
        return jsonify({"message": "Page must be greater than zero."}), 400

    if per_page < 1 or per_page > 100:
        return jsonify({"message": "per_page must be between 1 and 100."}), 400

    notifications_page = NotificationService.get_user_notifications(
        user_id=current_user_id,
        page=page,
        per_page=per_page,
        unread_only=unread_only,
        notification_type=notification_type,
        search=search,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order
    )

    unread_count = NotificationService.get_unread_count(current_user_id)

    return jsonify({
        "unread_count": unread_count,
        "notifications": [
            notification_to_dict(n)
            for n in notifications_page.items
        ],
        "pagination": {
            "page": notifications_page.page,
            "per_page": notifications_page.per_page,
            "total": notifications_page.total,
            "pages": notifications_page.pages
        }
    }), 200


# 2. GET UNREAD COUNT (For Topbar Badge)
@notifications_bp.get("/unread-count")
@jwt_required()
def get_unread_count():
    """
    Get the unread notification count for the top bar badge.
    ---
    tags:
      - Notification Management
    summary: Get unread notification count
    security:
      - Bearer: []
    responses:
      200:
        description: Unread badge count returned.
      401:
        description: Authentication required.
    """
    current_user_id = int(get_jwt_identity())
    count = NotificationService.get_unread_count(current_user_id)

    return jsonify({
        "unread_count": count
    }), 200


# 3. GET SINGLE NOTIFICATION
@notifications_bp.get("/<int:notification_id>")
@jwt_required()
def get_notification(notification_id):
    """
    Get a single notification by ID.
    ---
    tags:
      - Notification Management
    summary: Get notification details
    security:
      - Bearer: []
    parameters:
      - name: notification_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Notification found.
      401:
        description: Authentication required.
      403:
        description: Forbidden.
      404:
        description: Notification not found.
    """
    current_user_id = int(get_jwt_identity())
    notification = db.session.get(Notification, notification_id)

    if not notification:
        return jsonify({"message": "Notification not found."}), 404

    if notification.user_id != current_user_id:
        return jsonify({"message": "You do not have permission to access this notification."}), 403

    return jsonify({
        "notification": notification_to_dict(notification)
    }), 200


# 4. MARK SINGLE NOTIFICATION AS READ
@notifications_bp.patch("/<int:notification_id>/read")
@jwt_required()
def mark_notification_read(notification_id):
    """
    Mark a notification as read.
    ---
    tags:
      - Notification Management
    summary: Mark single notification as read
    security:
      - Bearer: []
    parameters:
      - name: notification_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Notification marked as read.
      401:
        description: Authentication required.
      403:
        description: Forbidden.
      404:
        description: Notification not found.
    """
    current_user_id = int(get_jwt_identity())
    notification = db.session.get(Notification, notification_id)

    if not notification:
        return jsonify({"message": "Notification not found."}), 404

    if notification.user_id != current_user_id:
        return jsonify({"message": "You do not have permission to modify this notification."}), 403

    NotificationService.mark_as_read(notification)

    return jsonify({
        "message": "Notification marked as read.",
        "notification": notification_to_dict(notification)
    }), 200


# 5. MARK ALL AS READ
@notifications_bp.patch("/read-all")
@jwt_required()
def mark_all_read():
    """
    Mark all unread notifications as read for current user.
    ---
    tags:
      - Notification Management
    summary: Mark all notifications as read
    security:
      - Bearer: []
    responses:
      200:
        description: All notifications marked as read.
      401:
        description: Authentication required.
    """
    current_user_id = int(get_jwt_identity())
    updated_count = NotificationService.mark_all_as_read(current_user_id)

    return jsonify({
        "message": f"Marked {updated_count} notifications as read."
    }), 200


# 6. DELETE NOTIFICATION
@notifications_bp.delete("/<int:notification_id>")
@jwt_required()
def delete_notification(notification_id):
    """
    Delete a notification.
    ---
    tags:
      - Notification Management
    summary: Delete a notification
    security:
      - Bearer: []
    parameters:
      - name: notification_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Notification deleted.
      401:
        description: Authentication required.
      403:
        description: Forbidden.
      404:
        description: Notification not found.
    """
    current_user_id = int(get_jwt_identity())
    notification = db.session.get(Notification, notification_id)

    if not notification:
        return jsonify({"message": "Notification not found."}), 404

    if notification.user_id != current_user_id:
        return jsonify({"message": "You do not have permission to delete this notification."}), 403

    NotificationService.delete_notification(notification)

    return jsonify({
        "message": "Notification deleted successfully."
    }), 200


# 7. SEND SYSTEM NOTIFICATION (Admin Broadcast)
@notifications_bp.post("")
@roles_required("Administrator")
def create_system_notification():
    """
    Send an administrative notification to a user.
    ---
    tags:
      - Notification Management
    summary: Send notification (Admin only)
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - user_id
            - title
            - message
          properties:
            user_id:
              type: integer
              example: 1
            type:
              type: string
              enum: [BOOKING, CAMPAIGN, INVOICE, PAYMENT, SYSTEM]
              example: "SYSTEM"
            title:
              type: string
              example: "System Maintenance Notice"
            message:
              type: string
              example: "The platform will undergo scheduled maintenance tonight at 2 AM."
            link:
              type: string
              example: "/dashboard"
    responses:
      201:
        description: Notification dispatched.
      400:
        description: Validation error.
      401:
        description: Authentication required.
      403:
        description: Administrator access required.
    """
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    try:
        validated = notification_create_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    notification = NotificationService.send_notification(
        user_id=validated["user_id"],
        title=validated["title"],
        message=validated["message"],
        notification_type=validated.get("type", "SYSTEM"),
        link=validated.get("link")
    )

    return jsonify({
        "message": "Notification sent successfully.",
        "notification": notification_to_dict(notification)
    }), 201