from datetime import date
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError

from app.extensions import db
from app.spaces import spaces_bp
from app.models.space import (
    AdvertisingSpace,
    Location,
    RateCard,
    SpaceCategory
)
from app.spaces.schemas import (
    LocationCreateSchema,
    LocationUpdateSchema,
    SpaceCategoryCreateSchema,
    SpaceCategoryUpdateSchema,
    AdvertisingSpaceCreateSchema,
    AdvertisingSpaceUpdateSchema,
    AdvertisingSpaceStatusSchema,
    RateCardCreateSchema,
    RateCardUpdateSchema
)
from app.spaces.service import (
    LocationService,
    SpaceCategoryService,
    AdvertisingSpaceService
)
from app.common.decorators import roles_required


# ===========================================================================
# SCHEMA INSTANCES
# ===========================================================================

# Schema used to validate data when creating a rate card.
rate_card_create_schema = RateCardCreateSchema()

# Schema used to validate data when updating a rate card.
rate_card_update_schema = RateCardUpdateSchema()


# ===========================================================================
# HELPER FUNCTIONS
# ===========================================================================

def get_rate_card_or_404(space_id, rate_card_id):
    """
    Returns a rate card only if it belongs to the specified
    advertising space.

    This prevents someone from accessing a rate card belonging
    to another advertising space through an incorrect URL.
    """
    return RateCard.query.filter_by(
        id=rate_card_id,
        space_id=space_id
    ).first_or_404(
        description="Rate card not found for this advertising space."
    )


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
    Convert a SpaceCategory database object into JSON-safe data.
    """
    return {
        "id": category.id,
        "name": category.name
    }


def space_to_dict(space):
    """
    Converts an AdvertisingSpace model object into
    JSON-safe data.

    Related category and location information is included
    because the frontend will normally need these details
    when displaying inventory.
    """

    return {
        "id": space.id,

        "name": space.name,

        "description": space.description,

        "dimensions": space.dimensions,

        # Decimal values are converted to strings to avoid
        # JSON precision problems.
        "base_rate": str(space.base_rate),

        "is_active": space.is_active,

        "created_at": space.created_at.isoformat(),

        "updated_at": space.updated_at.isoformat(),

        "category": {
            "id": space.category.id,
            "name": space.category.name
        },

        "location": {
            "id": space.location.id,
            "name": space.location.name,
            "city": space.location.city,
            "address": space.location.address
        }
    }




# ===========================================================================
# LOCATION ENDPOINTS
# ===========================================================================

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
    
    
# ==========================================
# ADVERTISING SPACE ENDPOINTS
# ==========================================    
    
    
@spaces_bp.get("/")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager"
)
def get_advertising_spaces():
    """
    Return all advertising spaces with filtering and pagination.
    ---
    tags:
      - Advertising Space Management

    summary: List all advertising spaces

    description: >
      Returns advertising spaces with support for pagination,
      category, location, city filtering, name search, and active status.
      Accessible by Administrator, Sales Executive, and Space Manager.

    security:
      - Bearer: []

    parameters:
      - name: page
        in: query
        type: integer
        required: false
        default: 1
        minimum: 1
        description: Page number.

      - name: per_page
        in: query
        type: integer
        required: false
        default: 10
        minimum: 1
        maximum: 100
        description: Number of records per page.

      - name: category_id
        in: query
        type: integer
        required: false
        description: Filter advertising spaces by category ID.

      - name: location_id
        in: query
        type: integer
        required: false
        description: Filter advertising spaces by location ID.

      - name: city
        in: query
        type: string
        required: false
        description: Filter advertising spaces by city.

      - name: search
        in: query
        type: string
        required: false
        description: Search advertising spaces by name.

      - name: is_active
        in: query
        type: boolean
        required: false
        description: Filter advertising spaces by active status.

      - name: min_price
        in: query
        type: number
        required: false
        description: Minimum base rate price filter.

      - name: max_price
        in: query
        type: number
        required: false
        description: Maximum base rate price filter.

      - name: sort_by
        in: query
        type: string
        enum: [name, base_rate, created_at]
        default: name
        required: false
        description: Sort field.

      - name: sort_order
        in: query
        type: string
        enum: [asc, desc]
        default: asc
        required: false
        description: Sort direction.

    responses:
      200:
        description: Advertising spaces retrieved successfully.

      400:
        description: Invalid pagination parameters.

      401:
        description: Authentication required.

      403:
        description: User does not have permission to access advertising spaces.
    """

    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=10, type=int)
    category_id = request.args.get("category_id", type=int)
    location_id = request.args.get("location_id", type=int)
    city = request.args.get("city", type=str)
    search = request.args.get("search", type=str)
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    sort_by = request.args.get("sort_by", default="name", type=str)
    sort_order = request.args.get("sort_order", default="asc", type=str)

    is_active_value = request.args.get("is_active")
    is_active = None

    if is_active_value is not None:
        normalized_value = is_active_value.lower().strip()
        if normalized_value == "true":
            is_active = True
        elif normalized_value == "false":
            is_active = False
        else:
            return jsonify({"message": "is_active must be true or false."}), 400

    if page < 1:
        return jsonify({"message": "Page must be greater than zero."}), 400

    if per_page < 1 or per_page > 100:
        return jsonify({"message": "per_page must be between 1 and 100."}), 400

    spaces = AdvertisingSpaceService.get_all(
        page=page,
        per_page=per_page,
        category_id=category_id,
        location_id=location_id,
        city=city,
        search=search,
        is_active=is_active,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_order=sort_order
    )

    return jsonify({
        "spaces": [
            space_to_dict(space)
            for space in spaces.items
        ],
        "pagination": {
            "page": spaces.page,
            "per_page": spaces.per_page,
            "total": spaces.total,
            "pages": spaces.pages,
            "has_next": spaces.has_next,
            "has_prev": spaces.has_prev
        }
    }), 200


# 2. GET SINGLE ADVERTISING SPACE
@spaces_bp.get("/<int:space_id>")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager",
    "Advertiser"
)
def get_advertising_space(space_id):
    """
    Return a single advertising space by ID.
    ---
    tags:
      - Advertising Space Management
    summary: Get an advertising space
    description: >
      Returns detailed information for a specific advertising space
      including its category and physical location.
    security:
      - Bearer: []
    parameters:
      - name: space_id
        in: path
        type: integer
        required: true
        description: ID of the advertising space.
    responses:
      200:
        description: Advertising space found.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
      404:
        description: Advertising space not found.
    """
    space = AdvertisingSpaceService.get_by_id(space_id)

    if not space:
        return jsonify({
            "message": f"Advertising space with ID {space_id} not found."
        }), 404

    return jsonify({
        "space": space_to_dict(space)
    }), 200


# 3. CREATE ADVERTISING SPACE
@spaces_bp.post("/")
@spaces_bp.post("")
@roles_required(
    "Administrator",
    "Space Manager"
)
def create_advertising_space():
    """
    Create a new advertising space.
    ---
    tags:
      - Advertising Space Management
    summary: Create an advertising space
    description: >
      Creates a new advertising space associated with a valid
      category and location.
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
            - category_id
            - location_id
            - base_rate
          properties:
            name:
              type: string
              example: "Billboard A-01"
            category_id:
              type: integer
              example: 1
            location_id:
              type: integer
              example: 1
            description:
              type: string
              example: "Large digital billboard facing North highway"
            dimensions:
              type: string
              example: "20x10 ft"
            base_rate:
              type: string
              example: "1500.00"
    responses:
      201:
        description: Space created successfully.
      400:
        description: Validation error or invalid category/location.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
    """
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    errors = AdvertisingSpaceCreateSchema().validate(data)
    if errors:
        return jsonify({
            "errors": errors
        }), 400

    # Ensure referenced category exists
    category = SpaceCategoryService.get_by_id(data["category_id"])
    if not category:
        return jsonify({
            "message": f"SpaceCategory with ID {data['category_id']} does not exist."
        }), 400

    # Ensure referenced location exists
    location = LocationService.get_by_id(data["location_id"])
    if not location:
        return jsonify({
            "message": f"Location with ID {data['location_id']} does not exist."
        }), 400

    space = AdvertisingSpaceService.create(data)

    return jsonify({
        "message": "Advertising space created successfully.",
        "space": space_to_dict(space)
    }), 201


# 4. UPDATE ADVERTISING SPACE
@spaces_bp.put("/<int:space_id>")
@roles_required(
    "Administrator",
    "Space Manager"
)
def update_advertising_space(space_id):
    """
    Update an existing advertising space.
    ---
    tags:
      - Advertising Space Management
    summary: Update an advertising space
    description: >
      Updates advertising space properties like name, dimensions,
      base rate, category, or location.
    security:
      - Bearer: []
    parameters:
      - name: space_id
        in: path
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
            category_id:
              type: integer
            location_id:
              type: integer
            description:
              type: string
            dimensions:
              type: string
            base_rate:
              type: string
    responses:
      200:
        description: Space updated successfully.
      400:
        description: Validation error or invalid foreign key.
      404:
        description: Space not found.
    """
    space = AdvertisingSpaceService.get_by_id(space_id)
    if not space:
        return jsonify({
            "message": f"Advertising space with ID {space_id} not found."
        }), 404

    data = request.get_json()
    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    errors = AdvertisingSpaceUpdateSchema().validate(data)
    if errors:
        return jsonify({
            "errors": errors
        }), 400

    # If updating category_id, verify it exists
    if "category_id" in data:
        category = SpaceCategoryService.get_by_id(data["category_id"])
        if not category:
            return jsonify({
                "message": f"SpaceCategory with ID {data['category_id']} does not exist."
            }), 400

    # If updating location_id, verify it exists
    if "location_id" in data:
        location = LocationService.get_by_id(data["location_id"])
        if not location:
            return jsonify({
                "message": f"Location with ID {data['location_id']} does not exist."
            }), 400

    updated_space = AdvertisingSpaceService.update(space, data)

    return jsonify({
        "message": "Advertising space updated successfully.",
        "space": space_to_dict(updated_space)
    }), 200


# 5. UPDATE SPACE STATUS (ACTIVATE / DEACTIVATE)
@spaces_bp.patch("/<int:space_id>/status")
@spaces_bp.put("/<int:space_id>/status")
@roles_required(
    "Administrator",
    "Space Manager"
)
def update_advertising_space_status(space_id):
    """
    Activate or deactivate an advertising space.
    ---
    tags:
      - Advertising Space Management
    summary: Update space active status
    description: >
      Sets an advertising space to active or inactive.
    security:
      - Bearer: []
    parameters:
      - name: space_id
        in: path
        type: integer
        required: true
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
    responses:
      200:
        description: Space status updated successfully.
      400:
        description: Validation error.
      404:
        description: Space not found.
    """
    space = AdvertisingSpaceService.get_by_id(space_id)
    if not space:
        return jsonify({
            "message": f"Advertising space with ID {space_id} not found."
        }), 404

    data = request.get_json()
    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    errors = AdvertisingSpaceStatusSchema().validate(data)
    if errors:
        return jsonify({
            "errors": errors
        }), 400

    updated_space = AdvertisingSpaceService.update_status(
        space,
        data["is_active"]
    )

    status_text = "activated" if data["is_active"] else "deactivated"
    return jsonify({
        "message": f"Advertising space successfully {status_text}.",
        "space": space_to_dict(updated_space)
    }), 200


# 6. DELETE ADVERTISING SPACE
@spaces_bp.delete("/<int:space_id>")
@roles_required(
    "Administrator",
    "Space Manager"
)
def delete_advertising_space(space_id):
    """
    Delete an advertising space.
    ---
    tags:
      - Advertising Space Management
    summary: Delete an advertising space
    description: >
      Deletes an advertising space. Deletion is blocked if the space has
      associated rate cards, availability records, or bookings.
    security:
      - Bearer: []
    parameters:
      - name: space_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Space deleted successfully.
      400:
        description: Cannot delete space with dependent records.
      404:
        description: Space not found.
    """
    space = AdvertisingSpaceService.get_by_id(space_id)
    if not space:
        return jsonify({
            "message": f"Advertising space with ID {space_id} not found."
        }), 404

    deleted = AdvertisingSpaceService.delete(space)
    if not deleted:
        return jsonify({
            "message": (
                "Cannot delete this advertising space because it has linked "
                "rate cards, bookings, or availability schedules. Deactivate it instead."
            )
        }), 400

    return jsonify({
        "message": "Advertising space deleted successfully."
    }), 200


# ===========================================================================
# RATE CARD ENDPOINTS
# ===========================================================================

# 1. CREATE RATE CARD
@spaces_bp.post("/<int:space_id>/rate-cards")
@jwt_required()
@roles_required("Administrator", "Space Manager")
def create_rate_card(space_id):
    """
    Create a new rate card for an advertising space.
    ---
    tags:
      - Advertising Space Management
    summary: Create a rate card for an advertising space
    description: >
      Creates a new rate card defining the price of an advertising space
      for a specific date range. Accessible by Administrator and Space Manager.
    security:
      - Bearer: []
    parameters:
      - name: space_id
        in: path
        type: integer
        required: true
        description: ID of the advertising space.
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - rate_type
            - price
            - effective_from
          properties:
            rate_type:
              type: string
              example: "monthly"
            price:
              type: string
              example: "250000.00"
            effective_from:
              type: string
              format: date
              example: "2026-01-01"
            effective_to:
              type: string
              format: date
              example: "2026-12-31"
    responses:
      201:
        description: Rate card created successfully.
      400:
        description: Validation error or invalid dates.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
      404:
        description: Advertising space not found.
    """
    # Confirm that the advertising space exists.
    space = AdvertisingSpace.query.get_or_404(
        space_id,
        description="Advertising space not found."
    )

    # Read JSON sent by the client.
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    try:
        # Validate and convert the incoming data.
        validated_data = rate_card_create_schema.load(data)
    except ValidationError as error:
        return jsonify({
            "errors": error.messages
        }), 400

    # Create the new rate card.
    rate_card = RateCard(
        space_id=space.id,
        rate_type=validated_data["rate_type"],
        price=validated_data["price"],
        effective_from=validated_data["effective_from"],
        effective_to=validated_data.get("effective_to")
    )

    # Save the record.
    db.session.add(rate_card)
    db.session.commit()

    return jsonify({
        "message": "Rate card created successfully.",
        "rate_card": {
            "id": rate_card.id,
            "space_id": rate_card.space_id,
            "rate_type": rate_card.rate_type,
            "price": str(rate_card.price),
            "effective_from": rate_card.effective_from.isoformat(),
            "effective_to": (
                rate_card.effective_to.isoformat()
                if rate_card.effective_to
                else None
            )
        }
    }), 201


# 2. GET ALL RATE CARDS FOR A SPACE
@spaces_bp.get("/<int:space_id>/rate-cards")
@jwt_required()
def get_rate_cards(space_id):
    """
    Return all rate cards belonging to one advertising space.
    ---
    tags:
      - Advertising Space Management
    summary: List all rate cards for a space
    description: >
      Returns all rate cards belonging to the specified advertising space.
      Accessible by any authenticated user.
    security:
      - Bearer: []
    parameters:
      - name: space_id
        in: path
        type: integer
        required: true
        description: ID of the advertising space.
    responses:
      200:
        description: Rate cards retrieved successfully.
      401:
        description: Authentication required.
      404:
        description: Advertising space not found.
    """
    # Confirm the advertising space exists.
    AdvertisingSpace.query.get_or_404(
        space_id,
        description="Advertising space not found."
    )

    # Get all rate cards belonging to this space.
    rate_cards = RateCard.query.filter_by(
        space_id=space_id
    ).order_by(
        RateCard.effective_from.desc()
    ).all()

    return jsonify({
        "rate_cards": [
            {
                "id": rate_card.id,
                "space_id": rate_card.space_id,
                "rate_type": rate_card.rate_type,
                "price": str(rate_card.price),
                "effective_from": rate_card.effective_from.isoformat(),
                "effective_to": (
                    rate_card.effective_to.isoformat()
                    if rate_card.effective_to
                    else None
                )
            }
            for rate_card in rate_cards
        ]
    }), 200


# 3. GET ONE RATE CARD
@spaces_bp.get("/<int:space_id>/rate-cards/<int:rate_card_id>")
@jwt_required()
def get_rate_card(space_id, rate_card_id):
    """
    Return one specific rate card belonging to an advertising space.
    ---
    tags:
      - Advertising Space Management
    summary: Get a specific rate card
    description: >
      Returns one rate card only if it belongs to the specified advertising space.
      Accessible by any authenticated user.
    security:
      - Bearer: []
    parameters:
      - name: space_id
        in: path
        type: integer
        required: true
        description: ID of the advertising space.
      - name: rate_card_id
        in: path
        type: integer
        required: true
        description: ID of the rate card.
    responses:
      200:
        description: Rate card retrieved successfully.
      401:
        description: Authentication required.
      404:
        description: Rate card not found for this space.
    """
    rate_card = get_rate_card_or_404(
        space_id,
        rate_card_id
    )

    return jsonify({
        "rate_card": {
            "id": rate_card.id,
            "space_id": rate_card.space_id,
            "rate_type": rate_card.rate_type,
            "price": str(rate_card.price),
            "effective_from": rate_card.effective_from.isoformat(),
            "effective_to": (
                rate_card.effective_to.isoformat()
                if rate_card.effective_to
                else None
            )
        }
    }), 200


# 4. UPDATE A RATE CARD
@spaces_bp.put("/<int:space_id>/rate-cards/<int:rate_card_id>")
@jwt_required()
@roles_required("Administrator", "Space Manager")
def update_rate_card(space_id, rate_card_id):
    """
    Update an existing rate card.
    ---
    tags:
      - Advertising Space Management
    summary: Update a rate card
    description: >
      Updates rate type, price, or date ranges for an existing rate card.
      Accessible by Administrator and Space Manager.
    security:
      - Bearer: []
    parameters:
      - name: space_id
        in: path
        type: integer
        required: true
        description: ID of the advertising space.
      - name: rate_card_id
        in: path
        type: integer
        required: true
        description: ID of the rate card.
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            rate_type:
              type: string
              example: "monthly"
            price:
              type: string
              example: "275000.00"
            effective_from:
              type: string
              format: date
              example: "2026-02-01"
            effective_to:
              type: string
              format: date
              example: "2026-12-31"
    responses:
      200:
        description: Rate card updated successfully.
      400:
        description: Validation error or invalid date combination.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
      404:
        description: Rate card not found for this space.
    """
    rate_card = get_rate_card_or_404(
        space_id,
        rate_card_id
    )

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    try:
        validated_data = rate_card_update_schema.load(data)
    except ValidationError as error:
        return jsonify({
            "errors": error.messages
        }), 400

    # Calculate the final dates before updating the record.
    # This is important because the request may contain only one
    # of the two date fields.
    final_effective_from = validated_data.get(
        "effective_from",
        rate_card.effective_from
    )

    final_effective_to = validated_data.get(
        "effective_to",
        rate_card.effective_to
    )

    # Ensure the final date combination is valid.
    if (
        final_effective_to is not None
        and final_effective_to < final_effective_from
    ):
        return jsonify({
            "errors": {
                "effective_to": [
                    "effective_to cannot be earlier than effective_from."
                ]
            }
        }), 400

    # Update only fields provided by the client.
    if "rate_type" in validated_data:
        rate_card.rate_type = validated_data["rate_type"]

    if "price" in validated_data:
        rate_card.price = validated_data["price"]

    rate_card.effective_from = final_effective_from
    rate_card.effective_to = final_effective_to

    db.session.commit()

    return jsonify({
        "message": "Rate card updated successfully.",
        "rate_card": {
            "id": rate_card.id,
            "space_id": rate_card.space_id,
            "rate_type": rate_card.rate_type,
            "price": str(rate_card.price),
            "effective_from": rate_card.effective_from.isoformat(),
            "effective_to": (
                rate_card.effective_to.isoformat()
                if rate_card.effective_to
                else None
            )
        }
    }), 200


# 5. DELETE A RATE CARD
@spaces_bp.delete("/<int:space_id>/rate-cards/<int:rate_card_id>")
@jwt_required()
@roles_required("Administrator", "Space Manager")
def delete_rate_card(space_id, rate_card_id):
    """
    Delete a rate card from an advertising space.
    ---
    tags:
      - Advertising Space Management
    summary: Delete a rate card
    description: >
      Deletes a rate card from an advertising space.
      Accessible by Administrator and Space Manager.
    security:
      - Bearer: []
    parameters:
      - name: space_id
        in: path
        type: integer
        required: true
        description: ID of the advertising space.
      - name: rate_card_id
        in: path
        type: integer
        required: true
        description: ID of the rate card.
    responses:
      200:
        description: Rate card deleted successfully.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
      404:
        description: Rate card not found for this space.
    """
    rate_card = get_rate_card_or_404(
        space_id,
        rate_card_id
    )

    db.session.delete(rate_card)
    db.session.commit()

    return jsonify({
        "message": "Rate card deleted successfully."
    }), 200


    