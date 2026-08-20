from datetime import date, datetime

from app.extensions import db


class SpaceCategory(db.Model):
    """
    Represents a category/type of advertising inventory.

    Examples:
    - Billboard
    - Digital Screen
    - Transit Advertisement
    - Banner
    - Website Advertisement
    - Event Space

    The requirement identifies space categories as a separate table
    so that advertising spaces do not have hard-coded category strings.
    """

    __tablename__ = "space_categories"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False,
        unique=True
    )

    # One category can contain many advertising spaces.
    spaces = db.relationship(
        "AdvertisingSpace",
        back_populates="category",
        lazy=True
    )

    def __repr__(self):
        return f"<SpaceCategory {self.name}>"


class Location(db.Model):
    """
    Represents the physical/geographic location of advertising inventory.

    The requirement specifies:
    name, address, city, latitude and longitude.

    Keeping location separate from AdvertisingSpace allows multiple
    advertising spaces to exist at the same location.
    """

    __tablename__ = "locations"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    address = db.Column(
        db.String(255),
        nullable=False
    )

    city = db.Column(
        db.String(100),
        nullable=False
    )

    latitude = db.Column(
        db.Numeric(10, 7),
        nullable=True
    )

    longitude = db.Column(
        db.Numeric(10, 7),
        nullable=True
    )

    # One location can contain multiple advertising spaces.
    spaces = db.relationship(
        "AdvertisingSpace",
        back_populates="location",
        lazy=True
    )

    def __repr__(self):
        return f"<Location {self.name}, {self.city}>"


class AdvertisingSpace(db.Model):
    """
    Represents an individual advertising space that can be offered
    to advertisers.

    Examples:
    - Billboard A-01
    - LED Screen Main Boulevard
    - Mall Entrance Display
    - Website Homepage Banner

    This is the central inventory table.
    """

    __tablename__ = "advertising_spaces"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    category_id = db.Column(
        db.Integer,
        db.ForeignKey("space_categories.id"),
        nullable=False
    )

    location_id = db.Column(
        db.Integer,
        db.ForeignKey("locations.id"),
        nullable=False
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    dimensions = db.Column(
        db.String(100),
        nullable=True
    )

    base_rate = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    # Used to determine whether the inventory can currently
    # be offered to advertisers.
    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationship to SpaceCategory.
    category = db.relationship(
        "SpaceCategory",
        back_populates="spaces"
    )

    # Relationship to Location.
    location = db.relationship(
        "Location",
        back_populates="spaces"
    )

    # A space can have multiple rate-card records over time.
    rate_cards = db.relationship(
        "RateCard",
        back_populates="space",
        cascade="all, delete-orphan",
        lazy=True
    )

    # A space can have multiple availability periods.
    availability_periods = db.relationship(
        "SpaceAvailability",
        back_populates="space",
        cascade="all, delete-orphan",
        lazy=True
    )

    def __repr__(self):
        return f"<AdvertisingSpace {self.name}>"


class RateCard(db.Model):
    """
    Defines time-bound pricing for an advertising space.

    The requirement specifies:
    - space_id
    - rate_type
    - price
    - effective_from
    - effective_to

    Rate cards allow pricing to change over time without overwriting
    historical pricing records.
    """

    __tablename__ = "rate_cards"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    space_id = db.Column(
        db.Integer,
        db.ForeignKey("advertising_spaces.id"),
        nullable=False
    )

    rate_type = db.Column(
        db.String(50),
        nullable=False
    )

    price = db.Column(
        db.Numeric(12, 2),
        nullable=False
    )

    effective_from = db.Column(
        db.Date,
        nullable=False
    )

    effective_to = db.Column(
        db.Date,
        nullable=True
    )

    space = db.relationship(
        "AdvertisingSpace",
        back_populates="rate_cards"
    )

    def __repr__(self):
        return f"<RateCard {self.rate_type}: {self.price}>"


class SpaceAvailability(db.Model):
    """
    Represents a date range associated with an advertising space.

    The requirement specifies:
    - space_id
    - start_date
    - end_date
    - is_booked

    This table will later be used by the availability service to
    detect scheduling conflicts and prevent overlapping bookings.
    """

    __tablename__ = "space_availability"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    space_id = db.Column(
        db.Integer,
        db.ForeignKey("advertising_spaces.id"),
        nullable=False
    )

    start_date = db.Column(
        db.Date,
        nullable=False
    )

    end_date = db.Column(
        db.Date,
        nullable=False
    )

    is_booked = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    space = db.relationship(
        "AdvertisingSpace",
        back_populates="availability_periods"
    )

    def __repr__(self):
        return (
            f"<SpaceAvailability "
            f"space={self.space_id} "
            f"{self.start_date} to {self.end_date}>"
        )