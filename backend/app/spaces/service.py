from app.extensions import db
from app.models.space import (
    Location,
    SpaceCategory,
    AdvertisingSpace
)



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
    
    
class SpaceCategoryService:
    """
    Handles advertising space category database operations.

    A category groups advertising spaces by type, such as
    Billboard, Digital Screen, or Transit Advertisement.
    """

    @staticmethod
    def get_all():
        """
        Returns all space categories sorted alphabetically.
        """

        return SpaceCategory.query.order_by(
            SpaceCategory.name.asc()
        ).all()

    @staticmethod
    def get_by_id(category_id):
        """
        Returns one space category by ID.

        Returns None if the category does not exist.
        """

        return db.session.get(
            SpaceCategory,
            category_id
        )

    @staticmethod
    def get_by_name(name):
        """
        Returns a category with the given name.

        This is used to prevent duplicate category names.
        """

        return SpaceCategory.query.filter(
            db.func.lower(SpaceCategory.name)
            == name.lower()
        ).first()

    @staticmethod
    def create(data):
        """
        Creates a new advertising space category.
        """

        category = SpaceCategory(
            name=data["name"].strip()
        )

        db.session.add(category)
        db.session.commit()

        return category

    @staticmethod
    def update(category, data):
        """
        Updates the category.

        The name is stripped to prevent accidental leading
        or trailing spaces.
        """

        if "name" in data:
            category.name = data["name"].strip()

        db.session.commit()

        return category

    @staticmethod
    def delete(category):
        """
        Deletes a category only when no advertising spaces
        are associated with it.

        Categories connected to existing spaces are preserved
        to avoid breaking inventory relationships.
        """

        if category.spaces:
            return False

        db.session.delete(category)
        db.session.commit()

        return True    
    
    
class AdvertisingSpaceService:
    """
    Handles advertising space database operations.

    AdvertisingSpace is the main inventory record representing
    a bookable advertising asset.
    """

    @staticmethod
    def get_all(
        page,
        per_page,
        category_id=None,
        location_id=None,
        city=None,
        search=None,
        is_active=None
    ):
        """
        Returns advertising spaces with optional filtering
        and pagination.
        """

        query = AdvertisingSpace.query.join(
            Location
        ).join(
            SpaceCategory
        )

        # Filter by category.
        if category_id is not None:
            query = query.filter(
                AdvertisingSpace.category_id == category_id
            )

        # Filter by location.
        if location_id is not None:
            query = query.filter(
                AdvertisingSpace.location_id == location_id
            )

        # Filter by city.
        if city:
            query = query.filter(
                db.func.lower(Location.city)
                == city.lower()
            )

        # Search by advertising space name.
        if search:
            query = query.filter(
                AdvertisingSpace.name.ilike(
                    f"%{search}%"
                )
            )

        # Filter by active or inactive status.
        if is_active is not None:
            query = query.filter(
                AdvertisingSpace.is_active == is_active
            )

        return query.order_by(
            AdvertisingSpace.name.asc()
        ).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

    @staticmethod
    def get_by_id(space_id):
        """
        Returns one advertising space by ID.

        Returns None if the space does not exist.
        """

        return db.session.get(
            AdvertisingSpace,
            space_id
        )

    @staticmethod
    def create(data):
        """
        Creates a new advertising space.
        """

        space = AdvertisingSpace(
            category_id=data["category_id"],
            location_id=data["location_id"],
            name=data["name"].strip(),
            description=data.get("description"),
            dimensions=data.get("dimensions"),
            base_rate=data["base_rate"]
        )

        db.session.add(space)
        db.session.commit()

        return space

    @staticmethod
    def update(space, data):
        """
        Updates only the fields provided by the client.
        """

        for field, value in data.items():

            # Prevent accidental leading or trailing spaces
            # in the advertising space name.
            if field == "name":
                value = value.strip()

            setattr(
                space,
                field,
                value
            )

        db.session.commit()

        return space

    @staticmethod
    def update_status(space, is_active):
        """
        Activates or deactivates an advertising space.

        Deactivation is preferred over deletion because
        spaces may later be connected to bookings, campaigns,
        contracts, and financial records.
        """

        space.is_active = is_active

        db.session.commit()

        return space

    @staticmethod
    def delete(space):
        """
        Deletes an advertising space.

        For now, deletion is allowed only if the space has
        no rate card or availability records.

        As the system grows, booking and campaign relationships
        will also be checked before deletion.
        """

        if (
            space.rate_cards
            or space.availability_periods
        ):
            return False

        db.session.delete(space)
        db.session.commit()

        return True 
    
    
    
       
    