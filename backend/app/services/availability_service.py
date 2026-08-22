from datetime import date
from app.extensions import db
from app.models.space import SpaceAvailability, AdvertisingSpace


class AvailabilityService:
    """
    Core service handling date ranges, scheduling, and
    interval overlap collision detection for advertising inventory.
    """

    @staticmethod
    def get_by_id(space_id: int, availability_id: int):
        """
        Returns an availability record only if it belongs to the specified space.
        """
        return SpaceAvailability.query.filter_by(
            id=availability_id,
            space_id=space_id
        ).first()

    @staticmethod
    def list_by_space(space_id: int):
        """
        Returns all availability/booking periods for a space in chronological order.
        """
        return SpaceAvailability.query.filter_by(
            space_id=space_id
        ).order_by(
            SpaceAvailability.start_date.asc()
        ).all()

    @staticmethod
    def find_conflicts(space_id: int, start_date: date, end_date: date):
        """
        Finds any overlapping confirmed bookings for a space.
        Uses interval intersection:
            Existing_Start <= Requested_End AND Existing_End >= Requested_Start
        """
        return SpaceAvailability.query.filter(
            SpaceAvailability.space_id == space_id,
            SpaceAvailability.is_booked.is_(True),
            SpaceAvailability.start_date <= end_date,
            SpaceAvailability.end_date >= start_date
        ).all()

    @staticmethod
    def check_availability(space_id: int, start_date: date, end_date: date):
        """
        Determines whether a space is free to be booked for a given date range.
        Returns (is_available: bool, conflict_record: SpaceAvailability | None)
        """
        conflicts = AvailabilityService.find_conflicts(space_id, start_date, end_date)
        if conflicts:
            return False, conflicts[0]
        return True, None

    @staticmethod
    def create(space_id: int, start_date: date, end_date: date, is_booked: bool = True):
        """
        Creates a new availability period or booking block.
        """
        availability = SpaceAvailability(
            space_id=space_id,
            start_date=start_date,
            end_date=end_date,
            is_booked=is_booked
        )
        db.session.add(availability)
        db.session.commit()
        return availability

    @staticmethod
    def delete(availability: SpaceAvailability):
        """
        Deletes an availability or block schedule.
        """
        db.session.delete(availability)
        db.session.commit()
        return True