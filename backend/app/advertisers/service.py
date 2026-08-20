from app.extensions import db
from app.models.advertiser import (
    Advertiser,
    AdvertiserContact
)


class AdvertiserService:
    """
    Handles advertiser-related business logic
    and database operations.
    """

    # Advertiser Management

    @staticmethod
    def get_all():
        """
        Returns all advertiser organizations.
        """

        return Advertiser.query.order_by(
            Advertiser.company_name.asc()
        ).all()

    @staticmethod
    def get_by_id(advertiser_id):
        """
        Returns an advertiser by its ID.

        Returns None if the advertiser does not exist.
        """

        return db.session.get(
            Advertiser,
            advertiser_id
        )

    @staticmethod
    def create(data):
        """
        Creates a new advertiser organization.
        """

        advertiser = Advertiser(
            company_name=data["company_name"],
            business_registration_number=data.get(
                "business_registration_number"
            ),
            tax_number=data.get("tax_number"),
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address"),
            city=data.get("city"),
            country=data.get("country")
        )

        # Save the new advertiser to the database
        db.session.add(advertiser)
        db.session.commit()

        return advertiser

    @staticmethod
    def update(advertiser, data):
        """
        Updates only the fields provided by the client.
        """

        # Update only the fields received in the request
        for field, value in data.items():
            setattr(
                advertiser,
                field,
                value
            )

        # Save the updated advertiser
        db.session.commit()

        return advertiser

    @staticmethod
    def update_status(advertiser, is_active):
        """
        Activates or deactivates an advertiser.

        We use status changes instead of deleting advertisers
        in normal cases because advertiser records will later
        be connected to campaigns, bookings, invoices, and payments.
        """

        # Update the advertiser's active status
        advertiser.is_active = is_active

        # Save the status change
        db.session.commit()

        return advertiser

    @staticmethod
    def delete(advertiser):
        """
        Permanently deletes an advertiser.

        This endpoint should be used carefully.

        Later, when advertisers are connected to campaigns,
        bookings, quotations, and payments, we will restrict
        or replace this with soft deletion.
        """

        # Delete the advertiser from the database
        db.session.delete(advertiser)

        # Save the deletion
        db.session.commit()

    # Advertiser Contacts
    @staticmethod
    def get_contacts(advertiser):
        """
        Returns all contacts belonging to an advertiser.
        """

        return advertiser.contacts

    @staticmethod
    def create_contact(advertiser, data):
        """
        Creates a new contact for an advertiser.

        If this contact is marked as primary, all other contacts
        for the same advertiser are changed to non-primary.
        """

        # Step 1: Get the primary status from the request
        is_primary = data.get(
            "is_primary",
            False
        )

        # Step 2: If this contact is primary,
        # make all existing contacts non-primary
        if is_primary:
            AdvertiserContact.query.filter_by(
                advertiser_id=advertiser.id
            ).update(
                {"is_primary": False}
            )

        # Step 3: Create the new advertiser contact
        contact = AdvertiserContact(
            advertiser_id=advertiser.id,
            name=data["name"],
            designation=data.get("designation"),
            email=data["email"],
            phone=data.get("phone"),
            is_primary=is_primary
        )

        # Step 4: Save the new contact to the database
        db.session.add(contact)
        db.session.commit()

        return contact

    @staticmethod
    def get_contact_by_id(contact_id):
        """
        Returns an advertiser contact by ID.
        """

        # Find the contact using its primary key
        return db.session.get(
            AdvertiserContact,
            contact_id
        )

    @staticmethod
    def update_contact(contact, data):
        """
        Updates an advertiser contact.

        If the contact is changed to primary, all other contacts
        belonging to the same advertiser are set to non-primary.
        """

        # Step 1: Check whether the contact is being made primary
        if data.get("is_primary") is True:

            # Make all other contacts for this advertiser non-primary
            AdvertiserContact.query.filter(
                AdvertiserContact.advertiser_id == contact.advertiser_id,
                AdvertiserContact.id != contact.id
            ).update(
                {"is_primary": False}
            )

        # Step 2: Update the fields provided by the client
        for field, value in data.items():
            setattr(
                contact,
                field,
                value
            )

        # Step 3: Save the updated contact
        db.session.commit()

        return contact

    @staticmethod
    def delete_contact(contact):
        """
        Deletes an advertiser contact.
        """

        # Delete the contact from the database
        db.session.delete(contact)

        # Save the deletion
        db.session.commit()