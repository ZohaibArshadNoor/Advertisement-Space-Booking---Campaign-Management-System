from flask import jsonify, request

from app.spaces import spaces_bp

from app.spaces.schemas import (
    LocationCreateSchema,
    LocationUpdateSchema
)

from app.spaces.service import LocationService

from app.common.decorators import roles_required


def location_to_dict(location):
    """
    Converts a Location database object into JSON-safe data.
    """

    return {
        "id": location.id,
        "name": location.name,
        "address": location.address,
        "city": location.city,

        # Decimal values are converted to strings so that
        # JSON serialization does not lose precision.
        "latitude": (
            str(location.latitude)
            if location.latitude is not None
            else None
        ),
        "longitude": (
            str(location.longitude)
            if location.longitude is not None
            else None
        )
    }


# ==========================================
# LOCATION ENDPOINTS
# ==========================================

@spaces_bp.get("/locations")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager"
)
def get_locations():
    """
    Return all advertising locations.

    ---
    tags:
      - Advertising Space Management
    summary: List all advertising locations
    description: Returns all configured advertising locations. Accessible by Administrator, Sales Executive, and Space Manager.
    security:
      - Bearer: []
    responses:
      200:
        description: Locations retrieved successfully
      401:
        description: Authentication required
      403:
        description: Insufficient permissions
    """

    locations = LocationService.get_all()

    return jsonify({
        "locations": [
            location_to_dict(location)
            for location in locations
        ]
    }), 200


@spaces_bp.get("/locations/<int:location_id>")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager"
)
def get_location(location_id):
    """
    Get a single advertising location by ID.

    ---
    tags:
      - Advertising Space Management
    summary: Get an advertising location
    description: Returns details of a specific advertising location. Accessible by Administrator, Sales Executive, and Space Manager.
    security:
      - Bearer: []
    parameters:
      - in: path
        name: location_id
        required: true
        type: integer
        description: ID of the location
        example: 1
    responses:
      200:
        description: Location retrieved successfully
      401:
        description: Authentication required
      403:
        description: Insufficient permissions
      404:
        description: Location not found
    """

    location = LocationService.get_by_id(
        location_id
    )

    if not location:
        return jsonify({
            "message": "Location not found."
        }), 404

    return jsonify({
        "location": location_to_dict(location)
    }), 200


@spaces_bp.post("/locations")
@roles_required(
    "Administrator",
    "Space Manager"
)
def create_location():
    """
    Create a new advertising location.

    ---
    tags:
      - Advertising Space Management
    summary: Create an advertising location
    description: Creates a new physical/geographic advertising location. Accessible by Administrator and Space Manager.
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
            - name
            - address
            - city
          properties:
            name:
              type: string
              example: "Times Square Billboard Plaza"
            address:
              type: string
              example: "Broadway & 7th Ave"
            city:
              type: string
              example: "New York"
            latitude:
              type: string
              example: "40.7588960"
            longitude:
              type: string
              example: "-73.9851300"
    responses:
      201:
        description: Location created successfully
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

    errors = LocationCreateSchema().validate(
        data
    )

    if errors:
        return jsonify({
            "errors": errors
        }), 400

    location = LocationService.create(
        data
    )

    return jsonify({
        "message": "Location created successfully.",
        "location": location_to_dict(location)
    }), 201


@spaces_bp.put("/locations/<int:location_id>")
@roles_required(
    "Administrator",
    "Space Manager"
)
def update_location(location_id):
    """
    Update an existing advertising location.

    ---
    tags:
      - Advertising Space Management
    summary: Update an advertising location
    description: Updates details of an existing advertising location. Accessible by Administrator and Space Manager.
    security:
      - Bearer: []
    consumes:
      - application/json
    produces:
      - application/json
    parameters:
      - in: path
        name: location_id
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
              example: "Times Square North Tower"
            address:
              type: string
              example: "1540 Broadway"
            city:
              type: string
              example: "New York"
            latitude:
              type: string
              example: "40.7588960"
            longitude:
              type: string
              example: "-73.9851300"
    responses:
      200:
        description: Location updated successfully
      400:
        description: Validation error or missing request body
      401:
        description: Authentication required
      403:
        description: Insufficient permissions
      404:
        description: Location not found
    """

    location = LocationService.get_by_id(
        location_id
    )

    if not location:
        return jsonify({
            "message": "Location not found."
        }), 404

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    errors = LocationUpdateSchema().validate(
        data
    )

    if errors:
        return jsonify({
            "errors": errors
        }), 400

    location = LocationService.update(
        location,
        data
    )

    return jsonify({
        "message": "Location updated successfully.",
        "location": location_to_dict(location)
    }), 200


@spaces_bp.delete("/locations/<int:location_id>")
@roles_required("Administrator")
def delete_location(location_id):
    """
    Delete an advertising location.

    ---
    tags:
      - Advertising Space Management
    summary: Delete an advertising location
    description: Deletes a location if no advertising spaces are connected to it. Administrator access required.
    security:
      - Bearer: []
    parameters:
      - in: path
        name: location_id
        required: true
        type: integer
        example: 1
    responses:
      200:
        description: Location deleted successfully
      401:
        description: Authentication required
      403:
        description: Administrator access required
      404:
        description: Location not found
      409:
        description: Cannot delete location with associated advertising spaces
    """

    location = LocationService.get_by_id(
        location_id
    )

    if not location:
        return jsonify({
            "message": "Location not found."
        }), 404

    deleted = LocationService.delete(
        location
    )

    if not deleted:
        return jsonify({
            "message": (
                "Location cannot be deleted because "
                "advertising spaces are associated with it."
            )
        }), 409

    return jsonify({
        "message": "Location deleted successfully."
    }), 200