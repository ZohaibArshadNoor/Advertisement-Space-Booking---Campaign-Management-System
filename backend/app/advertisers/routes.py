from flask import jsonify, request

from app.advertisers import advertisers_bp
from app.advertisers.schemas import (
    AdvertiserSchema,
    AdvertiserUpdateSchema,
    AdvertiserContactSchema
)
from app.advertisers.service import AdvertiserService
from app.common.decorators import roles_required


def advertiser_to_dict(advertiser):
    """
    Converts an Advertiser model object into JSON-safe data.
    """
    return {
        "id": advertiser.id,
        "company_name": advertiser.company_name,
        "business_registration_number": (
            advertiser.business_registration_number
        ),
        "tax_number": advertiser.tax_number,
        "email": advertiser.email,
        "phone": advertiser.phone,
        "address": advertiser.address,
        "city": advertiser.city,
        "country": advertiser.country,
        "is_active": advertiser.is_active,
        "created_at": (
            advertiser.created_at.isoformat()
            if advertiser.created_at
            else None
        ),
        "updated_at": (
            advertiser.updated_at.isoformat()
            if advertiser.updated_at
            else None
        )
    }


def contact_to_dict(contact):
    """
    Converts an AdvertiserContact model object into JSON-safe data.
    """
    return {
        "id": contact.id,
        "advertiser_id": contact.advertiser_id,
        "name": contact.name,
        "designation": contact.designation,
        "email": contact.email,
        "phone": contact.phone,
        "is_primary": contact.is_primary,
        "created_at": (
            contact.created_at.isoformat()
            if contact.created_at
            else None
        )
    }


# ==========================================
# ADVERTISER ENDPOINTS
# ==========================================

@advertisers_bp.get("/")
@roles_required("Administrator", "Sales Executive")
def get_advertisers():
    """
    Return all advertisers.

    ---
    tags:
      - Advertiser Management
    summary: List all advertisers
    description: Returns a list of all registered advertisers. Accessible by Administrator and Sales Executive.
    security:
      - Bearer: []
    responses:
      200:
        description: List of advertisers retrieved successfully
      401:
        description: Authentication required
      403:
        description: Insufficient permissions
    """
    advertisers = AdvertiserService.get_all()

    return jsonify({
        "advertisers": [
            advertiser_to_dict(advertiser)
            for advertiser in advertisers
        ]
    }), 200


@advertisers_bp.get("/<int:advertiser_id>")
@roles_required("Administrator", "Sales Executive")
def get_advertiser(advertiser_id):
    """
    Get a single advertiser by ID.

    ---
    tags:
      - Advertiser Management
    summary: Get an advertiser
    description: Returns details of a specific advertiser. Accessible by Administrator and Sales Executive.
    security:
      - Bearer: []
    parameters:
      - in: path
        name: advertiser_id
        required: true
        type: integer
        description: ID of the advertiser
        example: 1
    responses:
      200:
        description: Advertiser details retrieved successfully
      401:
        description: Authentication required
      403:
        description: Insufficient permissions
      404:
        description: Advertiser not found
    """
    advertiser = AdvertiserService.get_by_id(advertiser_id)

    if not advertiser:
        return jsonify({
            "message": "Advertiser not found."
        }), 404

    return jsonify({
        "advertiser": advertiser_to_dict(advertiser)
    }), 200


@advertisers_bp.post("/")
@roles_required("Administrator", "Sales Executive")
def create_advertiser():
    """
    Create a new advertiser organization.

    ---
    tags:
      - Advertiser Management
    summary: Create an advertiser
    description: Registers a new advertiser organization. Accessible by Administrator and Sales Executive.
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - company_name
          properties:
            company_name:
              type: string
              example: "Acme Corporation"
            business_registration_number:
              type: string
              example: "REG-123456"
            tax_number:
              type: string
              example: "TAX-987654"
            email:
              type: string
              example: "contact@acme.com"
            phone:
              type: string
              example: "+1234567890"
            address:
              type: string
              example: "123 Business St"
            city:
              type: string
              example: "Metropolis"
            country:
              type: string
              example: "USA"
    responses:
      201:
        description: Advertiser created successfully
      400:
        description: Validation error or missing request body
      401:
        description: Authentication required
      403:
        description: Insufficient permissions
    """
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    errors = AdvertiserSchema().validate(data)

    if errors:
        return jsonify({
            "errors": errors
        }), 400

    advertiser = AdvertiserService.create(data)

    return jsonify({
        "message": "Advertiser created successfully.",
        "advertiser": advertiser_to_dict(advertiser)
    }), 201


@advertisers_bp.put("/<int:advertiser_id>")
@roles_required("Administrator", "Sales Executive")
def update_advertiser(advertiser_id):
    """
    Update an existing advertiser's details.

    ---
    tags:
      - Advertiser Management
    summary: Update an advertiser
    description: Updates company details of an existing advertiser. Accessible by Administrator and Sales Executive.
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: path
        name: advertiser_id
        required: true
        type: integer
        example: 1
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            company_name:
              type: string
              example: "Acme International"
            business_registration_number:
              type: string
              example: "REG-654321"
            tax_number:
              type: string
              example: "TAX-123456"
            email:
              type: string
              example: "info@acme.com"
            phone:
              type: string
              example: "+1987654321"
            address:
              type: string
              example: "456 Commerce Blvd"
            city:
              type: string
              example: "Metropolis"
            country:
              type: string
              example: "USA"
    responses:
      200:
        description: Advertiser updated successfully
      400:
        description: Validation error or missing request body
      401:
        description: Authentication required
      403:
        description: Insufficient permissions
      404:
        description: Advertiser not found
    """
    advertiser = AdvertiserService.get_by_id(advertiser_id)

    if not advertiser:
        return jsonify({
            "message": "Advertiser not found."
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    errors = AdvertiserUpdateSchema().validate(data)

    if errors:
        return jsonify({
            "errors": errors
        }), 400

    advertiser = AdvertiserService.update(
        advertiser,
        data
    )

    return jsonify({
        "message": "Advertiser updated successfully.",
        "advertiser": advertiser_to_dict(advertiser)
    }), 200


@advertisers_bp.patch("/<int:advertiser_id>/status")
@roles_required("Administrator")
def update_advertiser_status(advertiser_id):
    """
    Activate or deactivate an advertiser.

    ---
    tags:
      - Advertiser Management
    summary: Toggle advertiser status
    description: Enable or disable an advertiser. Administrator access required.
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: path
        name: advertiser_id
        required: true
        type: integer
        example: 1
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - is_active
          properties:
            is_active:
              type: boolean
              example: false
    responses:
      200:
        description: Advertiser status updated successfully
      400:
        description: Invalid request data
      401:
        description: Authentication required
      403:
        description: Administrator access required
      404:
        description: Advertiser not found
    """
    advertiser = AdvertiserService.get_by_id(advertiser_id)

    if not advertiser:
        return jsonify({
            "message": "Advertiser not found."
        }), 404

    data = request.get_json()

    if not data or "is_active" not in data:
        return jsonify({
            "message": "is_active is required."
        }), 400

    if not isinstance(data["is_active"], bool):
        return jsonify({
            "message": "is_active must be true or false."
        }), 400

    advertiser = AdvertiserService.update_status(
        advertiser,
        data["is_active"]
    )

    return jsonify({
        "message": "Advertiser status updated successfully.",
        "advertiser": advertiser_to_dict(advertiser)
    }), 200


# ==========================================
# ADVERTISER CONTACT ENDPOINTS
# ==========================================

@advertisers_bp.get("/<int:advertiser_id>/contacts")
@roles_required("Administrator", "Sales Executive")
def get_advertiser_contacts(advertiser_id):
    """
    Return all contacts belonging to an advertiser.

    ---
    tags:
      - Advertiser Management
    summary: List advertiser contacts
    description: Returns all contact persons for a specified advertiser. Accessible by Administrator and Sales Executive.
    security:
      - Bearer: []
    parameters:
      - in: path
        name: advertiser_id
        required: true
        type: integer
        description: ID of the advertiser
        example: 1
    responses:
      200:
        description: Contacts retrieved successfully
      401:
        description: Authentication required
      403:
        description: Insufficient permissions
      404:
        description: Advertiser not found
    """
    advertiser = AdvertiserService.get_by_id(advertiser_id)

    if not advertiser:
        return jsonify({
            "message": "Advertiser not found."
        }), 404

    contacts = AdvertiserService.get_contacts(advertiser)

    return jsonify({
        "contacts": [
            contact_to_dict(contact)
            for contact in contacts
        ]
    }), 200


@advertisers_bp.post("/<int:advertiser_id>/contacts")
@roles_required("Administrator", "Sales Executive")
def create_advertiser_contact(advertiser_id):
    """
    Create a new contact for an advertiser.

    ---
    tags:
      - Advertiser Management
    summary: Add contact to advertiser
    description: Adds a new contact person to the specified advertiser. Accessible by Administrator and Sales Executive.
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: path
        name: advertiser_id
        required: true
        type: integer
        example: 1
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
            - email
          properties:
            name:
              type: string
              example: "John Contact"
            designation:
              type: string
              example: "Marketing Director"
            email:
              type: string
              example: "john.contact@acme.com"
            phone:
              type: string
              example: "+1234567890"
            is_primary:
              type: boolean
              example: true
    responses:
      201:
        description: Contact created successfully
      400:
        description: Validation error or missing request body
      401:
        description: Authentication required
      403:
        description: Insufficient permissions
      404:
        description: Advertiser not found
    """
    advertiser = AdvertiserService.get_by_id(advertiser_id)

    if not advertiser:
        return jsonify({
            "message": "Advertiser not found."
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    errors = AdvertiserContactSchema().validate(data)

    if errors:
        return jsonify({
            "errors": errors
        }), 400

    contact = AdvertiserService.create_contact(
        advertiser,
        data
    )

    return jsonify({
        "message": "Advertiser contact created successfully.",
        "contact": contact_to_dict(contact)
    }), 201


@advertisers_bp.patch("/contacts/<int:contact_id>")
@roles_required("Administrator", "Sales Executive")
def update_advertiser_contact(contact_id):
    """
    Update an advertiser contact.

    ---
    tags:
      - Advertiser Management
    summary: Update contact details
    description: Updates details of an existing advertiser contact. Accessible by Administrator and Sales Executive.
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: path
        name: contact_id
        required: true
        type: integer
        example: 1
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
              example: "John Contact Updated"
            designation:
              type: string
              example: "Chief Marketing Officer"
            email:
              type: string
              example: "john.cmo@acme.com"
            phone:
              type: string
              example: "+1987654321"
            is_primary:
              type: boolean
              example: true
    responses:
      200:
        description: Contact updated successfully
      400:
        description: Validation error or missing request body
      401:
        description: Authentication required
      403:
        description: Insufficient permissions
      404:
        description: Contact not found
    """
    contact = AdvertiserService.get_contact_by_id(contact_id)

    if not contact:
        return jsonify({
            "message": "Contact not found."
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    errors = AdvertiserContactSchema(
        partial=True
    ).validate(data)

    if errors:
        return jsonify({
            "errors": errors
        }), 400

    contact = AdvertiserService.update_contact(
        contact,
        data
    )

    return jsonify({
        "message": "Contact updated successfully.",
        "contact": contact_to_dict(contact)
    }), 200


@advertisers_bp.delete("/contacts/<int:contact_id>")
@roles_required("Administrator")
def delete_advertiser_contact(contact_id):
    """
    Delete an advertiser contact.

    ---
    tags:
      - Advertiser Management
    summary: Delete contact
    description: Deletes a contact person from an advertiser. Administrator access required.
    security:
      - Bearer: []
    parameters:
      - in: path
        name: contact_id
        required: true
        type: integer
        example: 1
    responses:
      200:
        description: Contact deleted successfully
      401:
        description: Authentication required
      403:
        description: Administrator access required
      404:
        description: Contact not found
    """
    contact = AdvertiserService.get_contact_by_id(contact_id)

    if not contact:
        return jsonify({
            "message": "Contact not found."
        }), 404

    AdvertiserService.delete_contact(contact)

    return jsonify({
        "message": "Contact deleted successfully."
    }), 200