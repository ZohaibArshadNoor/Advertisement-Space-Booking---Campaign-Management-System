from datetime import date
from decimal import Decimal

from app.extensions import db
from app.models.booking import Booking, BookingStatus
from app.models.space import AdvertisingSpace
from app.services.availability_service import AvailabilityService
from app.services.audit_service import AuditService
from app.models.audit import AuditAction


class BookingService:
    """
    Handles business logic for advertising space bookings.

    This service coordinates:
    1. Validation of advertising spaces.
    2. Conflict detection via AvailabilityService.
    3. Price calculation based on space rate cards and duration.
    4. Lifecycle state transitions (Pending -> Confirmed -> Cancelled/Completed).
    5. Automatic blocking and unblocking of availability schedules.
    """

    @staticmethod
    def calculate_price(space, start_date, end_date):
        """
        Calculates the booking price based on space base rate and duration.

        Duration is inclusive of both start_date and end_date.
        """
        duration_days = (end_date - start_date).days + 1
        return Decimal(space.base_rate) * Decimal(duration_days)

    @staticmethod
    def get_by_id(booking_id):
        """
        Returns one booking record by primary key ID.
        """
        return db.session.get(Booking, booking_id)

    @staticmethod
    def get_by_reference(booking_reference):
        """
        Returns a booking by its unique reference string.
        """
        return Booking.query.filter_by(
            booking_reference=booking_reference
        ).first()

    @staticmethod
    def get_all(
        page=1,
        per_page=10,
        user_id=None,
        advertiser_id=None,
        space_id=None,
        campaign_id=None,
        status=None,
        start_date=None,
        end_date=None,
        min_price=None,
        max_price=None,
        search=None,
        sort_by="created_at",
        sort_order="desc"
    ):
        """
        Returns paginated booking records with advanced filtering,
        keyword search, date boundaries, and whitelisted sorting.
        """
        query = Booking.query.join(AdvertisingSpace)

        # 1. Filter by creator user ID
        if user_id is not None:
            query = query.filter(Booking.user_id == user_id)

        # 2. Filter by advertiser company ID
        if advertiser_id is not None:
            query = query.filter(Booking.advertiser_id == advertiser_id)

        # 3. Filter by space ID
        if space_id is not None:
            query = query.filter(Booking.space_id == space_id)

        # 4. Filter by campaign ID
        if campaign_id is not None:
            query = query.filter(Booking.campaign_id == campaign_id)

        # 5. Filter by workflow status
        if status:
            query = query.filter(Booking.status == status)

        # 6. Date boundaries
        if start_date is not None:
            query = query.filter(Booking.start_date >= start_date)
        if end_date is not None:
            query = query.filter(Booking.end_date <= end_date)

        # 7. Price range
        if min_price is not None:
            query = query.filter(Booking.total_price >= min_price)
        if max_price is not None:
            query = query.filter(Booking.total_price <= max_price)

        # 8. Keyword search (booking reference, notes, space name)
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                db.or_(
                    Booking.booking_reference.ilike(search_term),
                    Booking.notes.ilike(search_term),
                    AdvertisingSpace.name.ilike(search_term)
                )
            )

        # 9. Whitelisted sorting
        sort_fields = {
            "created_at": Booking.created_at,
            "start_date": Booking.start_date,
            "end_date": Booking.end_date,
            "total_price": Booking.total_price,
            "status": Booking.status
        }
        sort_column = sort_fields.get(sort_by, Booking.created_at)
        if str(sort_order).lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # 10. Capped pagination
        safe_per_page = min(max(1, per_page), 100)
        safe_page = max(1, page)

        return query.paginate(
            page=safe_page,
            per_page=safe_per_page,
            error_out=False
        )

    @staticmethod
    def create_booking(
        user_id,
        space_id,
        start_date,
        end_date,
        advertiser_id=None,
        notes=None
    ):
        """
        Creates a new booking request.

        Validates:
        1. Advertising space exists and is active.
        2. Date range does not conflict with existing booked schedules.
        3. Computes total price.
        """
        # Step 1: Confirm the advertising space exists.
        space = db.session.get(AdvertisingSpace, space_id)
        if not space:
            return None, "Advertising space not found."

        # Step 2: Ensure the inventory space is active.
        if not space.is_active:
            return None, "This advertising space is currently inactive."

        # Step 3: Check for scheduling conflicts with existing bookings.
        is_available, conflict = AvailabilityService.check_availability(
            space_id=space.id,
            start_date=start_date,
            end_date=end_date
        )

        if not is_available:
            return None, (
                f"Conflict detected: Space is already booked from "
                f"{conflict.start_date} to {conflict.end_date}."
            )

        # Step 4: Calculate total price.
        total_price = BookingService.calculate_price(
            space=space,
            start_date=start_date,
            end_date=end_date
        )

        # Step 5: Instantiate and save the booking record.
        booking = Booking(
            user_id=user_id,
            advertiser_id=advertiser_id,
            space_id=space.id,
            start_date=start_date,
            end_date=end_date,
            status=BookingStatus.PENDING,
            total_price=total_price,
            notes=notes.strip() if notes else None
        )

        db.session.add(booking)
        db.session.commit()
        
        # 1. Send Notification to Advertiser
        try:
            from app.services.notification_service import NotificationService
            from app.models.notification import NotificationType
            NotificationService.send_notification(
                user_id=user_id,
                title="Booking Request Submitted",
                message=f"Your booking request {booking.booking_reference} for {space.name} has been received and is pending confirmation.",
                notification_type=NotificationType.BOOKING,
                link=f"/bookings/{booking.id}"
            )
        except Exception:
            pass

        # 2. Record Audit Log
        AuditService.log(
            user_id=user_id,
            action=AuditAction.CREATE,
            entity_type="Booking",
            entity_id=booking.id,
            new_values={
                "booking_reference": booking.booking_reference,
                "space_id": booking.space_id,
                "start_date": booking.start_date.isoformat(),
                "end_date": booking.end_date.isoformat(),
                "total_price": str(booking.total_price),
                "status": booking.status
            }
        )

        return booking, None

    @staticmethod
    def update_status(booking, new_status, user_id=None):
        """
        Updates the booking status and manages availability blocks.
        """
        if new_status not in BookingStatus.ALL:
            return None, f"Invalid status. Must be one of {BookingStatus.ALL}"

        old_status = booking.status
        booking.status = new_status

        # If confirming, officially lock the availability dates.
        if new_status == BookingStatus.CONFIRMED and old_status != BookingStatus.CONFIRMED:
            AvailabilityService.create(
                space_id=booking.space_id,
                start_date=booking.start_date,
                end_date=booking.end_date,
                is_booked=True
            )

        # If cancelling a previously confirmed booking, release the availability block.
        elif new_status == BookingStatus.CANCELLED and old_status == BookingStatus.CONFIRMED:
            from app.models.space import SpaceAvailability
            matching_schedules = SpaceAvailability.query.filter_by(
                space_id=booking.space_id,
                start_date=booking.start_date,
                end_date=booking.end_date,
                is_booked=True
            ).all()
            for schedule in matching_schedules:
                db.session.delete(schedule)

        db.session.commit()

        # 1. Send In-App Notification to Booking Owner (Advertiser)
        try:
            from app.services.notification_service import NotificationService
            from app.models.notification import NotificationType
            space_name = booking.space.name if booking.space else "Space"
            NotificationService.send_notification(
                user_id=booking.user_id,
                title=f"Booking Status: {new_status}",
                message=f"Your booking {booking.booking_reference} for {space_name} has been updated to {new_status}.",
                notification_type=NotificationType.BOOKING,
                link=f"/bookings/{booking.id}"
            )
        except Exception:
            pass

        # 2. Record Audit Log for the Staff Member
        AuditService.log(
            user_id=user_id,
            action=AuditAction.UPDATE_STATUS,
            entity_type="Booking",
            entity_id=booking.id,
            old_values={"status": old_status},
            new_values={"status": new_status}
        )

        return booking, None

    @staticmethod
    def delete(booking):
        """
        Deletes a booking record.

        If the booking was confirmed, releases the corresponding
        SpaceAvailability block so inventory is available again.
        """
        # If the booking was confirmed, release any linked availability schedule.
        if booking.status == BookingStatus.CONFIRMED:
            from app.models.space import SpaceAvailability
            matching_schedules = SpaceAvailability.query.filter_by(
                space_id=booking.space_id,
                start_date=booking.start_date,
                end_date=booking.end_date,
                is_booked=True
            ).all()
            for schedule in matching_schedules:
                db.session.delete(schedule)

        db.session.delete(booking)
        db.session.commit()
        
        AuditService.log(
            action=AuditAction.DELETE,
            entity_type="Booking",
            entity_id=booking.id,
            old_values={
                "booking_reference": booking.booking_reference,
                "status": booking.status
            }
        )
        return True