from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError

from app.bookings import bookings_bp
from app.bookings.schemas import (
    BookingCreateSchema,
    BookingStatusUpdateSchema
)
from app.services.booking_service import BookingService
from app.common.decorators import roles_required
from app.models.user import User
from app.extensions import db

# ===========================================================================
# SCHEMA INSTANCES
# ===========================================================================

booking_create_schema = BookingCreateSchema()
booking_status_update_schema = BookingStatusUpdateSchema()


# ===========================================================================
# HELPER FUNCTIONS
# ===========================================================================

def booking_to_dict(booking):
    """
    Converts a Booking database object into JSON-safe data.
    """
    return {
        "id": booking.id,
        "booking_reference": booking.booking_reference,
        "user_id": booking.user_id,
        "user_name": booking.user.name if booking.user else None,
        "advertiser_id": booking.advertiser_id,
        "advertiser_name": (
            booking.advertiser.company_name
            if booking.advertiser
            else None
        ),
        "space_id": booking.space_id,
        "space_name": booking.space.name if booking.space else None,
        "start_date": booking.start_date.isoformat(),
        "end_date": booking.end_date.isoformat(),
        "status": booking.status,
        "total_price": str(booking.total_price),
        "notes": booking.notes,
        "created_at": (
            booking.created_at.isoformat()
            if booking.created_at
            else None
        ),
        "updated_at": (
            booking.updated_at.isoformat()
            if booking.updated_at
            else None
        )
    }


# ===========================================================================
# BOOKING ENDPOINTS
# ===========================================================================

# 1. CREATE BOOKING
@bookings_bp.post("")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager",
    "Advertiser"
)
def create_booking():
    """
    Create a new advertising space booking request.
    ---
    tags:
      - Booking Management

    summary: Create a booking request

    description: >
      Submits a new booking request for an advertising space.
      Automatically validates space availability and calculates total price.
      Accessible by Administrator, Sales Executive, Space Manager, and Advertiser.

    security:
      - Bearer: []

    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - space_id
            - start_date
            - end_date
          properties:
            space_id:
              type: integer
              example: 1
            start_date:
              type: string
              format: date
              example: "2026-06-01"
            end_date:
              type: string
              format: date
              example: "2026-06-30"
            advertiser_id:
              type: integer
              example: 1
            notes:
              type: string
              example: "Summer Product Launch Campaign"

    responses:
      201:
        description: Booking created successfully.
      400:
        description: Validation error or schedule conflict.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
    """
    # Step 1: Read JSON data from the request.
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    # Step 2: Validate the request payload.
    try:
        validated_data = booking_create_schema.load(data)
    except ValidationError as error:
        return jsonify({
            "errors": error.messages
        }), 400

    # Step 3: Identify current user context.
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    advertiser_id = validated_data.get("advertiser_id")
    if not advertiser_id and current_user and current_user.advertiser_id:
        advertiser_id = current_user.advertiser_id

    # Step 4: Create booking through the service layer.
    booking, error = BookingService.create_booking(
        user_id=current_user_id,
        space_id=validated_data["space_id"],
        start_date=validated_data["start_date"],
        end_date=validated_data["end_date"],
        advertiser_id=advertiser_id,
        notes=validated_data.get("notes")
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    # Step 5: Return newly created booking record.
    return jsonify({
        "message": "Booking created successfully.",
        "booking": booking_to_dict(booking)
    }), 201


# 2. LIST BOOKINGS
@bookings_bp.get("")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager",
    "Finance Officer",
    "Advertiser"
)
def get_bookings():
    """
    List bookings with pagination and filters.
    ---
    tags:
      - Booking Management

    summary: List bookings

    description: >
      Returns a paginated list of bookings. Advertisers only see
      their own bookings. Internal staff see all bookings.

    security:
      - Bearer: []

    parameters:
      - name: page
        in: query
        type: integer
        default: 1
        description: Page number.
      - name: per_page
        in: query
        type: integer
        default: 10
        description: Items per page.
      - name: status
        in: query
        type: string
        enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
        description: Filter by workflow status.
      - name: space_id
        in: query
        type: integer
        description: Filter by space ID.

    responses:
      200:
        description: Bookings retrieved successfully.
      401:
        description: Authentication required.
    """
    # Step 1: Get query parameters.
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    status = request.args.get("status")
    space_id = request.args.get("space_id", type=int)

    if page < 1:
        return jsonify({"message": "Page must be greater than zero."}), 400

    if per_page < 1 or per_page > 100:
        return jsonify({"message": "per_page must be between 1 and 100."}), 400

    # Step 2: Apply role-based scoping.
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    user_filter = None
    if current_user and current_user.role.name == "Advertiser":
        user_filter = current_user.id

    # Step 3: Fetch paginated bookings.
    bookings_page = BookingService.get_all(
        page=page,
        per_page=per_page,
        user_id=user_filter,
        space_id=space_id,
        status=status
    )

    # Step 4: Return response.
    return jsonify({
        "bookings": [
            booking_to_dict(b)
            for b in bookings_page.items
        ],
        "pagination": {
            "page": bookings_page.page,
            "per_page": bookings_page.per_page,
            "total": bookings_page.total,
            "pages": bookings_page.pages
        }
    }), 200


# 3. GET SINGLE BOOKING
@bookings_bp.get("/<int:booking_id>")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager",
    "Finance Officer",
    "Advertiser"
)
def get_booking(booking_id):
    """
    Get detailed information about a specific booking.
    ---
    tags:
      - Booking Management

    summary: Get booking by ID

    security:
      - Bearer: []

    parameters:
      - name: booking_id
        in: path
        type: integer
        required: true
        description: ID of the booking.

    responses:
      200:
        description: Booking retrieved successfully.
      403:
        description: Insufficient permissions.
      404:
        description: Booking not found.
    """
    # Step 1: Retrieve booking from database.
    booking = BookingService.get_by_id(booking_id)

    if not booking:
        return jsonify({
            "message": "Booking not found."
        }), 404

    # Step 2: Enforce privacy for Advertiser role.
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if current_user and current_user.role.name == "Advertiser":
        if booking.user_id != current_user.id:
            return jsonify({
                "message": "You do not have permission to access this booking."
            }), 403

    # Step 3: Return booking data.
    return jsonify({
        "booking": booking_to_dict(booking)
    }), 200


# 4. UPDATE BOOKING STATUS
@bookings_bp.patch("/<int:booking_id>/status")
@roles_required(
    "Administrator",
    "Space Manager"
)
def update_booking_status(booking_id):
    """
    Update the status of a booking.
    ---
    tags:
      - Booking Management

    summary: Update booking status

    description: >
      Transitions a booking between PENDING, CONFIRMED, CANCELLED, or COMPLETED.
      When CONFIRMED, the system automatically locks the availability schedule.
      When CANCELLED, any active availability schedule is released.
      Automatically records an audit trail and dispatches an in-app notification to the advertiser.
      Accessible by Administrator and Space Manager only.

    security:
      - Bearer: []

    parameters:
      - name: booking_id
        in: path
        type: integer
        required: true
        description: ID of the booking.
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - status
          properties:
            status:
              type: string
              enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
              example: "CONFIRMED"

    responses:
      200:
        description: Booking status updated successfully.
      400:
        description: Invalid status value.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
      404:
        description: Booking not found.
    """
    # Step 1: Retrieve booking.
    booking = BookingService.get_by_id(booking_id)

    if not booking:
        return jsonify({
            "message": "Booking not found."
        }), 404

    # Step 2: Read request body.
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    # Step 3: Validate status payload.
    try:
        validated_data = booking_status_update_schema.load(data)
    except ValidationError as error:
        return jsonify({
            "errors": error.messages
        }), 400

    # Step 4: Extract actor identity.
    current_user_id = int(get_jwt_identity())

    # Step 5: Perform status transition in service layer.
    updated_booking, error = BookingService.update_status(
        booking=booking,
        new_status=validated_data["status"],
        user_id=current_user_id
    )

    if error:
        return jsonify({
            "message": error
        }), 400

    # Step 6: Return updated booking record.
    return jsonify({
        "message": f"Booking status updated to {validated_data['status']}.",
        "booking": booking_to_dict(updated_booking)
    }), 200

# 5. DELETE BOOKING
@bookings_bp.delete("/<int:booking_id>")
@roles_required(
    "Administrator",
    "Space Manager",
    "Advertiser"
)
def delete_booking(booking_id):
    """
    Delete a booking record.
    ---
    tags:
      - Booking Management

    summary: Delete a booking

    description: >
      Deletes a booking record. If the booking was confirmed, the system
      automatically releases the associated space availability schedule.
      Advertisers can only delete their own bookings.

    security:
      - Bearer: []

    parameters:
      - name: booking_id
        in: path
        type: integer
        required: true
        description: ID of the booking to delete.

    responses:
      200:
        description: Booking deleted successfully.
      403:
        description: Insufficient permissions.
      404:
        description: Booking not found.
    """
    # Step 1: Retrieve booking from database.
    booking = BookingService.get_by_id(booking_id)

    if not booking:
        return jsonify({
            "message": "Booking not found."
        }), 404

    # Step 2: Enforce role-based permission for Advertisers.
    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if current_user and current_user.role.name == "Advertiser":
        if booking.user_id != current_user.id:
            return jsonify({
                "message": "You do not have permission to delete this booking."
            }), 403

    # Step 3: Delete booking and release availability if confirmed.
    BookingService.delete(booking)

    # Step 4: Return confirmation.
    return jsonify({
        "message": "Booking deleted successfully."
    }), 200