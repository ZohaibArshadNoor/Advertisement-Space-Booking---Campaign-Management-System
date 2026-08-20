from flask import jsonify, request

from app.spaces import spaces_bp

from app.spaces.schemas import (
    LocationCreateSchema,
    LocationUpdateSchema,
    SpaceCategoryCreateSchema,
    SpaceCategoryUpdateSchema
)

from app.spaces.service import (
    LocationService,
    SpaceCategoryService
)

from app.common.decorators import roles_required


# HELPER FUNCTIONS
def location_to_dict(location):
    """
    Convert a Location database object into JSON-safe data.
    """

    return {
        "id": location.id,
        "name": location.name,
        "address": location.address,
        "city": location.city,

        # Convert Decimal values to strings so that
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


def category_to_dict(category):
    """
    Convert a SpaceCategory database object
    into JSON-safe data.
    """

    return {
        "id": category.id,
        "name": category.name
    }


# LOCATION ENDPOINTS
# 1. LIST ALL LOCATIONS
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

    description: >
      Returns all configured advertising locations.
      Accessible by Administrator, Sales Executive,
      and Space Manager.

    security:
      - Bearer: []

    responses:
      200:
        description: Locations retrieved successfully
        schema:
          type: object
          properties:
            locations:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                    example: 1
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

      401:
        description: Authentication required

      403:
        description: Insufficient permissions
    """

    # Step 1: Get all locations from the service layer.
    locations = LocationService.get_all()

    # Step 2: Convert database objects into JSON-safe dictionaries.
    location_list = [
        location_to_dict(location)
        for location in locations
    ]

    # Step 3: Return the locations.
    return jsonify({
        "locations": location_list
    }), 200


# 2. GET LOCATION BY ID
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

    description: >
      Returns details of a specific advertising location.
      Accessible by Administrator, Sales Executive,
      and Space Manager.

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
        schema:
          type: object
          properties:
            location:
              type: object
              properties:
                id:
                  type: integer
                  example: 1
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

      401:
        description: Authentication required

      403:
        description: Insufficient permissions

      404:
        description: Location not found
    """

    # Step 1: Find the requested location.
    location = LocationService.get_by_id(
        location_id
    )

    # Step 2: Return 404 if the location does not exist.
    if not location:
        return jsonify({
            "message": "Location not found."
        }), 404

    # Step 3: Return the location.
    return jsonify({
        "location": location_to_dict(location)
    }), 200


# 3. CREATE LOCATION

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

    description: >
      Creates a new physical/geographic advertising location.
      Accessible by Administrator and Space Manager.

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
        description: Advertising location information
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

    # Step 1: Read JSON data from the request.
    data = request.get_json()

    # Step 2: Make sure a request body was provided.
    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    # Step 3: Validate the request data.
    errors = LocationCreateSchema().validate(
        data
    )

    # Return validation errors.
    if errors:
        return jsonify({
            "errors": errors
        }), 400

    # Step 4: Create the location through the service layer.
    location = LocationService.create(
        data
    )

    # Step 5: Return the newly created location.
    return jsonify({
        "message": "Location created successfully.",
        "location": location_to_dict(location)
    }), 201


# 4. UPDATE LOCATION
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

    description: >
      Updates details of an existing advertising location.
      Accessible by Administrator and Space Manager.

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
        description: ID of the location
        example: 1

      - in: body
        name: body
        required: true
        description: Updated location information
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

    # Step 1: Find the existing location.
    location = LocationService.get_by_id(
        location_id
    )

    # Return 404 if the location does not exist.
    if not location:
        return jsonify({
            "message": "Location not found."
        }), 404

    # Step 2: Read the request body.
    data = request.get_json()

    # Make sure request data exists.
    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    # Step 3: Validate the update data.
    errors = LocationUpdateSchema().validate(
        data
    )

    if errors:
        return jsonify({
            "errors": errors
        }), 400

    # Step 4: Update the location.
    location = LocationService.update(
        location,
        data
    )

    # Step 5: Return the updated location.
    return jsonify({
        "message": "Location updated successfully.",
        "location": location_to_dict(location)
    }), 200


# 5. DELETE LOCATION
@spaces_bp.delete("/locations/<int:location_id>")
@roles_required(
    "Administrator",
    "Space Manager"
)
def delete_location(location_id):
    """
    Delete an advertising location.
    ---
    tags:
      - Advertising Space Management

    summary: Delete an advertising location

    description: >
      Deletes an advertising location if no advertising
      spaces are associated with it. Administrator access required.

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

    # Step 1: Find the location.
    location = LocationService.get_by_id(
        location_id
    )

    # Return 404 if it does not exist.
    if not location:
        return jsonify({
            "message": "Location not found."
        }), 404

    # Step 2: Attempt to delete the location.
    deleted = LocationService.delete(
        location
    )

    # Return 409 if related advertising spaces exist.
    if not deleted:
        return jsonify({
            "message": (
                "Location cannot be deleted because "
                "advertising spaces are associated with it."
            )
        }), 409

    # Step 3: Return success response.
    return jsonify({
        "message": "Location deleted successfully."
    }), 200


# ===========================================================================
# SPACE CATEGORY ENDPOINTS
# ===========================================================================


# 6. LIST ALL SPACE CATEGORIES
@spaces_bp.get("/categories")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager"
)
def get_space_categories():
    """
    Return all advertising space categories.
    ---
    tags:
      - Advertising Space Management

    summary: List all space categories

    description: >
      Returns all configured advertising space categories.
      Accessible by Administrator, Sales Executive,
      and Space Manager.

    security:
      - Bearer: []

    responses:
      200:
        description: Space categories retrieved successfully
        schema:
          type: object
          properties:
            categories:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                    example: 1
                  name:
                    type: string
                    example: "Billboard"

      401:
        description: Authentication required

      403:
        description: Insufficient permissions
    """

    # Step 1: Get all categories from the service layer.
    categories = SpaceCategoryService.get_all()

    # Step 2: Convert categories to JSON-safe dictionaries.
    category_list = [
        category_to_dict(category)
        for category in categories
    ]

    # Step 3: Return the categories.
    return jsonify({
        "categories": category_list
    }), 200


# 7. GET SPACE CATEGORY BY ID
@spaces_bp.get("/categories/<int:category_id>")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager"
)
def get_space_category(category_id):
    """
    Get a single advertising space category by ID.
    ---
    tags:
      - Advertising Space Management

    summary: Get a space category

    description: >
      Returns details of a specific advertising space category.

    security:
      - Bearer: []

    parameters:
      - in: path
        name: category_id
        required: true
        type: integer
        description: ID of the space category
        example: 1

    responses:
      200:
        description: Space category retrieved successfully
        schema:
          type: object
          properties:
            category:
              type: object
              properties:
                id:
                  type: integer
                  example: 1
                name:
                  type: string
                  example: "Billboard"

      401:
        description: Authentication required

      403:
        description: Insufficient permissions

      404:
        description: Space category not found
    """

    # Step 1: Find the requested category.
    category = SpaceCategoryService.get_by_id(
        category_id
    )

    # Step 2: Return 404 if it does not exist.
    if not category:
        return jsonify({
            "message": "Space category not found."
        }), 404

    # Step 3: Return the category.
    return jsonify({
        "category": category_to_dict(category)
    }), 200


# 8. CREATE SPACE CATEGORY
@spaces_bp.post("/categories")
@roles_required(
    "Administrator",
    "Space Manager"
)
def create_space_category():
    """
    Create a new advertising space category.
    ---
    tags:
      - Advertising Space Management

    summary: Create a space category

    description: >
      Creates a new advertising space category.
      Accessible by Administrator and Space Manager.

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
        description: Space category information
        schema:
          type: object
          required:
            - name
          properties:
            name:
              type: string
              example: "Billboard"

    responses:
      201:
        description: Space category created successfully

      400:
        description: Validation error or missing request body

      401:
        description: Authentication required

      403:
        description: Insufficient permissions

      409:
        description: Space category already exists
    """

    # Step 1: Read the request body.
    data = request.get_json()

    # Step 2: Make sure request data exists.
    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    # Step 3: Validate the request data.
    errors = SpaceCategoryCreateSchema().validate(
        data
    )

    if errors:
        return jsonify({
            "errors": errors
        }), 400

    # Step 4: Check for duplicate category names.
    existing_category = (
        SpaceCategoryService.get_by_name(
            data["name"].strip()
        )
    )

    if existing_category:
        return jsonify({
            "message": (
                "A space category with this name "
                "already exists."
            )
        }), 409

    # Step 5: Create the category.
    category = SpaceCategoryService.create(
        data
    )

    # Step 6: Return the created category.
    return jsonify({
        "message": (
            "Space category created successfully."
        ),
        "category": category_to_dict(category)
    }), 201


# 9. UPDATE SPACE CATEGORY
@spaces_bp.put("/categories/<int:category_id>")
@roles_required(
    "Administrator",
    "Space Manager"
)
def update_space_category(category_id):
    """
    Update an existing advertising space category.
    ---
    tags:
      - Advertising Space Management

    summary: Update a space category

    description: >
      Updates an existing advertising space category.
      Accessible by Administrator and Space Manager.

    security:
      - Bearer: []

    consumes:
      - application/json

    produces:
      - application/json

    parameters:
      - in: path
        name: category_id
        required: true
        type: integer
        description: ID of the space category
        example: 1

      - in: body
        name: body
        required: true
        description: Updated space category information
        schema:
          type: object
          properties:
            name:
              type: string
              example: "Digital Billboard"

    responses:
      200:
        description: Space category updated successfully

      400:
        description: Validation error or missing request body

      401:
        description: Authentication required

      403:
        description: Insufficient permissions

      404:
        description: Space category not found

      409:
        description: Space category name already exists
    """

    # Step 1: Find the category.
    category = SpaceCategoryService.get_by_id(
        category_id
    )

    # Return 404 if it does not exist.
    if not category:
        return jsonify({
            "message": "Space category not found."
        }), 404

    # Step 2: Read the request body.
    data = request.get_json()

    # Make sure request data exists.
    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    # Step 3: Validate the update data.
    errors = SpaceCategoryUpdateSchema().validate(
        data
    )

    if errors:
        return jsonify({
            "errors": errors
        }), 400

    # Step 4: Check whether the new category name
    # is already being used by another category.
    if "name" in data:

        existing_category = (
            SpaceCategoryService.get_by_name(
                data["name"].strip()
            )
        )

        # The current category is allowed to keep its own name.
        if (
            existing_category
            and existing_category.id != category.id
        ):
            return jsonify({
                "message": (
                    "A space category with this name "
                    "already exists."
                )
            }), 409

    # Step 5: Update the category.
    category = SpaceCategoryService.update(
        category,
        data
    )

    # Step 6: Return the updated category.
    return jsonify({
        "message": (
            "Space category updated successfully."
        ),
        "category": category_to_dict(category)
    }), 200


# 10. DELETE SPACE CATEGORY
@spaces_bp.delete("/categories/<int:category_id>")
@roles_required(
    "Administrator",
    "Space Manager"
)
def delete_space_category(category_id):
    """
    Delete an advertising space category.
    ---
    tags:
      - Advertising Space Management

    summary: Delete a space category

    description: >
      Deletes a space category only if no advertising
      spaces are associated with it.
      Administrator access required.

    security:
      - Bearer: []

    parameters:
      - in: path
        name: category_id
        required: true
        type: integer
        description: ID of the space category
        example: 1

    responses:
      200:
        description: Space category deleted successfully

      401:
        description: Authentication required

      403:
        description: Administrator access required

      404:
        description: Space category not found

      409:
        description: Cannot delete category with associated advertising spaces
    """

    # Step 1: Find the category.
    category = SpaceCategoryService.get_by_id(
        category_id
    )

    # Return 404 if the category does not exist.
    if not category:
        return jsonify({
            "message": "Space category not found."
        }), 404

    # Step 2: Attempt to delete the category.
    deleted = SpaceCategoryService.delete(
        category
    )

    # Return 409 if advertising spaces are associated.
    if not deleted:
        return jsonify({
            "message": (
                "Space category cannot be deleted because "
                "advertising spaces are associated with it."
            )
        }), 409

    # Step 3: Return success response.
    return jsonify({
        "message": (
            "Space category deleted successfully."
        )
    }), 200