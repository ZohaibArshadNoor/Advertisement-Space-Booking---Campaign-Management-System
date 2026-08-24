from app.extensions import db
from app.models.notification import Notification, NotificationType


class NotificationService:
    """
    Service responsible for creating, listing, and managing user notifications.
    """

    @staticmethod
    def send_notification(
        user_id: int,
        title: str,
        message: str,
        notification_type: str = NotificationType.SYSTEM,
        link: str = None
    ) -> Notification:
        """
        Creates and stores a new in-app notification for a user.
        """
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title.strip(),
            message=message.strip(),
            link=link.strip() if link else None,
            is_read=False
        )

        db.session.add(notification)
        db.session.commit()
        return notification

    @staticmethod
    def get_user_notifications(
        user_id: int,
        page: int = 1,
        per_page: int = 20,
        unread_only: bool = False,
        notification_type: str = None,
        search: str = None,
        start_date = None,
        end_date = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ):
        """
        Returns paginated notifications for a specific user with advanced filtering.
        """
        query = Notification.query.filter_by(user_id=user_id)

        if unread_only:
            query = query.filter_by(is_read=False)

        if notification_type:
            query = query.filter_by(type=notification_type)

        if start_date:
            query = query.filter(Notification.created_at >= start_date)

        if end_date:
            query = query.filter(Notification.created_at <= end_date)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                db.or_(
                    Notification.title.ilike(search_term),
                    Notification.message.ilike(search_term)
                )
            )

        sort_fields = {
            "created_at": Notification.created_at,
            "title": Notification.title,
            "type": Notification.type
        }
        sort_column = sort_fields.get(sort_by, Notification.created_at)
        if str(sort_order).lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        safe_per_page = min(max(1, per_page), 100)
        safe_page = max(1, page)

        return query.paginate(
            page=safe_page,
            per_page=safe_per_page,
            error_out=False
        )

    @staticmethod
    def get_unread_count(user_id: int) -> int:
        """
        Returns the number of unread notifications for the bell badge.
        """
        return Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()

    @staticmethod
    def mark_as_read(notification: Notification) -> Notification:
        """
        Marks a single notification as read.
        """
        notification.is_read = True
        db.session.commit()
        return notification

    @staticmethod
    def mark_all_as_read(user_id: int) -> int:
        """
        Marks all unread notifications as read for a given user.
        """
        updated_count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).update({"is_read": True})

        db.session.commit()
        return updated_count

    @staticmethod
    def delete_notification(notification: Notification) -> bool:
        """
        Deletes a single notification.
        """
        db.session.delete(notification)
        db.session.commit()
        return True