from app.extensions import db
from app.models.space import Location


class LocationService:
    """
    Handles location related database operations
    and business logic.
    """

    @staticmethod
    def get_all():
        """
        Returns all advertising locations.

        Locations are sorted by city and then by name
        to make the result easier to browse.
        """

        return Location.query.order_by(
            Location.city.asc(),
            Location.name.asc()
        ).all()

    @staticmethod
    def get_by_id(location_id):
        """
        Returns one location by ID.

        Returns None when the location does not exist.
        """

        return db.session.get(
            Location,
            location_id
        )

    @staticmethod
    def create(data):
        """
        Creates a new advertising location.
        """

        location = Location(
            name=data["name"],
            address=data["address"],
            city=data["city"],
            latitude=data.get("latitude"),
            longitude=data.get("longitude")
        )

        db.session.add(location)
        db.session.commit()

        return location

    @staticmethod
    def update(location, data):
        """
        Updates only the fields provided by the client.
        """

        for field, value in data.items():
            setattr(
                location,
                field,
                value
            )

        db.session.commit()

        return location

    @staticmethod
    def delete(location):
        """
        Deletes a location.

        A location must not be deleted if advertising spaces
        are already connected to it.
        """

        if location.spaces:
            return False

        db.session.delete(location)
        db.session.commit()

        return True 