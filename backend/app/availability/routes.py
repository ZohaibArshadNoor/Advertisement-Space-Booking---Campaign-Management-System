from flask import jsonify, request
from marshmallow import ValidationError

from app.availability import availability_bp
from app.availability.schemas import (
    SpaceAvailabilityCreateSchema,
    CheckAvailabilityQuerySchema
)
from app.services.availability_service import AvailabilityService
from app.models.space import AdvertisingSpace, SpaceAvailability
from app.common.decorators import roles_required

# Instantiate validation schemas
space_availability_create_schema = SpaceAvailabilityCreateSchema()
check_availability_query_schema = CheckAvailabilityQuerySchema()


# ===========================================================================
# SPACE AVAILABILITY & CONFLICT DETECTION ENDPOINTS
# ===========================================================================

# 1. CHECK SPACE AVAILABILITY / CONFLICT DETECTION
@availability_bp.get("/spaces/<int:space_id>/check")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager",
    "Advertiser"
)
def check_space_availability(space_id):
    """
    Check if an advertising space is available for a date range.
    ---
    tags:
      - Space Availability Management
    summary: Check space availability for dates
    description: >
      Evaluates booking collisions within the requested date range.
      Accessible by Administrator, Sales Executive, Space Manager, and Advertiser.
    security:
      - Bearer: []
    parameters:
      - name: space_id
        in: path
        type: integer
        required: true
        description: ID of the advertising space.
      - name: start_date
        in: query
        type: string
        format: date
        required: true
        example: "2026-03-01"
      - name: end_date
        in: query
        type: string
        format: date
        required: true
        example: "2026-03-31"
    responses:
      200:
        description: Availability evaluated successfully.
      400:
        description: Invalid query parameters or date order.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
      404:
        description: Space not found.
    """
    space = AdvertisingSpace.query.get_or_404(
        space_id,
        description="Advertising space not found."
    )

    try:
        params = check_availability_query_schema.load(request.args)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    is_available, conflict = AvailabilityService.check_availability(
        space_id=space.id,
        start_date=params["start_date"],
        end_date=params["end_date"]
    )

    if not is_available:
        return jsonify({
            "available": False,
            "message": "Space is already booked for the selected date range.",
            "conflict": {
                "id": conflict.id,
                "start_date": conflict.start_date.isoformat(),
                "end_date": conflict.end_date.isoformat()
            }
        }), 200

    return jsonify({
        "available": True,
        "message": "Space is available for the selected dates.",
        "space_id": space.id,
        "start_date": params["start_date"].isoformat(),
        "end_date": params["end_date"].isoformat()
    }), 200


# 2. LIST AVAILABILITY SCHEDULES FOR A SPACE
@availability_bp.get("/spaces/<int:space_id>")
@roles_required(
    "Administrator",
    "Sales Executive",
    "Space Manager",
    "Advertiser"
)
def get_space_availability(space_id):
    """
    List all availability and booking schedules for a space.
    ---
    tags:
      - Space Availability Management
    summary: List availability schedules for a space
    description: >
      Returns all booked and blocked schedules for a space ordered chronologically.
      Accessible by Administrator, Sales Executive, Space Manager, and Advertiser.
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
        description: Schedules retrieved successfully.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
      404:
        description: Space not found.
    """
    space = AdvertisingSpace.query.get_or_404(
        space_id,
        description="Advertising space not found."
    )

    schedules = AvailabilityService.list_by_space(space.id)

    return jsonify({
        "availability": [
            {
                "id": s.id,
                "space_id": s.space_id,
                "start_date": s.start_date.isoformat(),
                "end_date": s.end_date.isoformat(),
                "is_booked": s.is_booked
            }
            for s in schedules
        ]
    }), 200


# 3. CREATE AVAILABILITY / BLOCK DATES
@availability_bp.post("/spaces/<int:space_id>")
@roles_required(
    "Administrator",
    "Space Manager"
)
def create_space_availability(space_id):
    """
    Block or reserve a date range for an advertising space.
    ---
    tags:
      - Space Availability Management
    summary: Create an availability schedule
    description: >
      Reserves or blocks dates on an advertising space.
      Accessible by Administrator and Space Manager only.
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
            - start_date
            - end_date
          properties:
            start_date:
              type: string
              format: date
              example: "2026-04-01"
            end_date:
              type: string
              format: date
              example: "2026-04-30"
            is_booked:
              type: boolean
              example: true
    responses:
      201:
        description: Schedule created successfully.
      400:
        description: Validation error or overlapping booking.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
      404:
        description: Space not found.
    """
    space = AdvertisingSpace.query.get_or_404(
        space_id,
        description="Advertising space not found."
    )

    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    try:
        validated_data = space_availability_create_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    start_date = validated_data["start_date"]
    end_date = validated_data["end_date"]
    is_booked = validated_data.get("is_booked", True)

    if is_booked:
        is_available, conflict = AvailabilityService.check_availability(
            space_id=space.id,
            start_date=start_date,
            end_date=end_date
        )
        if not is_available:
            return jsonify({
                "message": (
                    f"Conflict detected: Space is already booked from "
                    f"{conflict.start_date} to {conflict.end_date}."
                )
            }), 400

    schedule = AvailabilityService.create(
        space_id=space.id,
        start_date=start_date,
        end_date=end_date,
        is_booked=is_booked
    )

    return jsonify({
        "message": "Availability schedule recorded successfully.",
        "availability": {
            "id": schedule.id,
            "space_id": schedule.space_id,
            "start_date": schedule.start_date.isoformat(),
            "end_date": schedule.end_date.isoformat(),
            "is_booked": schedule.is_booked
        }
    }), 201


# 4. DELETE AVAILABILITY SCHEDULE
@availability_bp.delete("/<int:availability_id>")
@roles_required(
    "Administrator",
    "Space Manager"
)
def delete_space_availability(availability_id):
    """
    Delete an availability or block schedule.
    ---
    tags:
      - Space Availability Management
    summary: Delete an availability schedule
    description: >
      Deletes an availability schedule.
      Accessible by Administrator and Space Manager only.
    security:
      - Bearer: []
    parameters:
      - name: availability_id
        in: path
        type: integer
        required: true
        description: ID of the availability schedule.
    responses:
      200:
        description: Schedule deleted successfully.
      401:
        description: Authentication required.
      403:
        description: Insufficient permissions.
      404:
        description: Schedule not found.
    """
    schedule = SpaceAvailability.query.get_or_404(
        availability_id,
        description="Availability schedule not found."
    )

    AvailabilityService.delete(schedule)

    return jsonify({
        "message": "Availability schedule removed successfully."
    }), 200