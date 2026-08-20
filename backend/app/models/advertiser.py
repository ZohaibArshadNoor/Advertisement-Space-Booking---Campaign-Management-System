from datetime import datetime

from app.extensions import db


class Advertiser(db.Model):
    """
    Represents an advertiser/customer organization.

    An advertiser is different from a User.

    User:
        Represents an account that can log into the system.

    Advertiser:
        Represents the business/customer organization that
        purchases advertising inventory.

    One advertiser can have multiple contacts and multiple
    users associated with it.
    """

    __tablename__ = "advertisers"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    company_name = db.Column(
        db.String(150),
        nullable=False
    )

    business_registration_number = db.Column(
        db.String(100),
        nullable=True,
        unique=True
    )

    tax_number = db.Column(
        db.String(100),
        nullable=True,
        unique=True
    )

    email = db.Column(
        db.String(150),
        nullable=True
    )

    phone = db.Column(
        db.String(30),
        nullable=True
    )

    address = db.Column(
        db.String(255),
        nullable=True
    )

    city = db.Column(
        db.String(100),
        nullable=True
    )

    country = db.Column(
        db.String(100),
        nullable=True
    )

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
    
    # One advertiser organization can have multiple user accounts.
    users = db.relationship(
    "User",
    back_populates="advertiser",
    lazy=True
    )

    # One advertiser can have multiple contacts.
    contacts = db.relationship(
        "AdvertiserContact",
        back_populates="advertiser",
        cascade="all, delete-orphan",
        lazy=True
    )

    def __repr__(self):
        return f"<Advertiser {self.company_name}>"


class AdvertiserContact(db.Model):
    """
    Represents a contact person belonging to an advertiser.

    A company can have multiple contacts, for example:
    - Marketing Manager
    - Finance Manager
    - Procurement Officer

    Contacts are stored separately instead of putting all contact
    information directly into the Advertiser table.
    """

    __tablename__ = "advertiser_contacts"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    advertiser_id = db.Column(
        db.Integer,
        db.ForeignKey("advertisers.id"),
        nullable=False
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    designation = db.Column(
        db.String(100),
        nullable=True
    )

    email = db.Column(
        db.String(150),
        nullable=False
    )

    phone = db.Column(
        db.String(30),
        nullable=True
    )

    is_primary = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    advertiser = db.relationship(
        "Advertiser",
        back_populates="contacts"
    )

    def __repr__(self):
        return f"<AdvertiserContact {self.name}>"