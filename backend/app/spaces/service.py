from app.extensions import db
from app.models.space import (
    Location,
    SpaceCategory,
    AdvertisingSpace
)
from app.models.audit import AuditAction
from app.services.audit_service import AuditService



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
        page=1,
        per_page=10,
        category_id=None,
        location_id=None,
        city=None,
        search=None,
        is_active=None,
        min_price=None,
        max_price=None,
        sort_by="name",
        sort_order="asc"
    ):
        """
        Returns advertising spaces with advanced multi-criteria filtering,
        keyword search, price ranges, and SQL-injection-safe sorting.
        """
        from sqlalchemy.orm import joinedload

        query = AdvertisingSpace.query.options(
            joinedload(AdvertisingSpace.location),
            joinedload(AdvertisingSpace.category)
        ).join(
            Location
        ).join(
            SpaceCategory
        )

        # 1. Filter by category
        if category_id is not None:
            query = query.filter(AdvertisingSpace.category_id == category_id)

        # 2. Filter by location ID
        if location_id is not None:
            query = query.filter(AdvertisingSpace.location_id == location_id)

        # 3. Filter by city
        if city:
            query = query.filter(db.func.lower(Location.city) == city.strip().lower())

        # 4. Multi-field Keyword Search (name, description, location name, location city)
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                db.or_(
                    AdvertisingSpace.name.ilike(search_term),
                    AdvertisingSpace.description.ilike(search_term),
                    Location.name.ilike(search_term),
                    Location.city.ilike(search_term)
                )
            )

        # 5. Filter by active status
        if is_active is not None:
            query = query.filter(AdvertisingSpace.is_active == is_active)

        # 6. Price range filtering
        if min_price is not None:
            query = query.filter(AdvertisingSpace.base_rate >= min_price)
        if max_price is not None:
            query = query.filter(AdvertisingSpace.base_rate <= max_price)

        # 7. Safe whitelisted sorting
        sort_fields = {
            "name": AdvertisingSpace.name,
            "base_rate": AdvertisingSpace.base_rate,
            "created_at": AdvertisingSpace.created_at
        }
        sort_column = sort_fields.get(sort_by, AdvertisingSpace.name)
        if str(sort_order).lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # 8. Capped pagination
        safe_per_page = min(max(1, per_page), 100)
        safe_page = max(1, page)

        return query.paginate(
            page=safe_page,
            per_page=safe_per_page,
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

        rate = data.get("base_rate") or data.get("daily_rate")
        space = AdvertisingSpace(
            category_id=data["category_id"],
            location_id=data["location_id"],
            name=data["name"].strip(),
            description=data.get("description"),
            dimensions=data.get("dimensions"),
            base_rate=rate
        )

        db.session.add(space)
        db.session.commit()

        try:
            AuditService.log(
                action=AuditAction.CREATE,
                entity_type="AdvertisingSpace",
                entity_id=space.id,
                new_values={
                    "name": space.name,
                    "category_id": space.category_id,
                    "location_id": space.location_id,
                    "base_rate": str(space.base_rate),
                    "is_active": space.is_active
                }
            )
        except Exception:
            pass

        return space

    @staticmethod
    def update(space, data):
        """
        Updates only the fields provided by the client.
        """
        old_values = {
            "name": space.name,
            "category_id": space.category_id,
            "location_id": space.location_id,
            "base_rate": str(space.base_rate),
            "is_active": space.is_active
        }

        if "base_rate" in data:
            space.base_rate = data["base_rate"]
        elif "daily_rate" in data:
            space.base_rate = data["daily_rate"]

        for field, value in data.items():
            if field in ["base_rate", "daily_rate", "code", "traffic_count", "resolution", "status", "category_name", "location_name", "city", "address"]:
                continue
            if field == "name" and isinstance(value, str):
                value = value.strip()
            if hasattr(space, field):
                setattr(space, field, value)

        db.session.commit()

        try:
            AuditService.log(
                action=AuditAction.UPDATE,
                entity_type="AdvertisingSpace",
                entity_id=space.id,
                old_values=old_values,
                new_values={
                    "name": space.name,
                    "category_id": space.category_id,
                    "location_id": space.location_id,
                    "base_rate": str(space.base_rate),
                    "is_active": space.is_active
                }
            )
        except Exception:
            pass

        return space

    @staticmethod
    def update_status(space, is_active):
        """
        Activates or deactivates an advertising space.

        Deactivation is preferred over deletion because
        spaces may later be connected to bookings, campaigns,
        contracts, and financial records.
        """
        old_status = space.is_active
        space.is_active = is_active

        db.session.commit()

        try:
            AuditService.log(
                action=AuditAction.UPDATE_STATUS,
                entity_type="AdvertisingSpace",
                entity_id=space.id,
                old_values={"is_active": old_status, "name": space.name},
                new_values={"is_active": space.is_active, "name": space.name}
            )
        except Exception:
            pass

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

        space_id = space.id
        space_name = space.name

        db.session.delete(space)
        db.session.commit()

        try:
            AuditService.log(
                action=AuditAction.DELETE,
                entity_type="AdvertisingSpace",
                entity_id=space_id,
                old_values={"name": space_name}
            )
        except Exception:
            pass

        return True 
    
    
    
       
    