from flask import jsonify, request
from app.audit_logs import audit_logs_bp
from app.services.audit_service import AuditService
from app.common.decorators import roles_required


def audit_to_dict(log):
    return {
        "id": log.id,
        "user_id": log.user_id,
        "user_name": log.user.name if log.user else "System",
        "user_email": log.user.email if log.user else None,
        "action": log.action,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "old_values": log.old_values,
        "new_values": log.new_values,
        "ip_address": log.ip_address,
        "created_at": (
            log.created_at.isoformat()
            if log.created_at
            else None
        )
    }


# 1. LIST AUDIT LOGS (Admin Only)
@audit_logs_bp.get("")
@roles_required("Administrator")
def get_audit_logs():
    """
    List system audit logs with pagination and filters.
    ---
    tags:
      - Audit & Compliance Logging
    summary: List audit logs (Admin only)
    security:
      - Bearer: []
    parameters:
      - name: page
        in: query
        type: integer
        default: 1
      - name: per_page
        in: query
        type: integer
        default: 20
      - name: entity_type
        in: query
        type: string
        example: "Booking"
      - name: entity_id
        in: query
        type: integer
      - name: action
        in: query
        type: string
        enum: [CREATE, UPDATE, UPDATE_STATUS, DELETE, LOGIN]
      - name: user_id
        in: query
        type: integer
    responses:
      200:
        description: Audit logs retrieved successfully.
      401:
        description: Authentication required.
      403:
        description: Administrator access required.
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    entity_type = request.args.get("entity_type")
    entity_id = request.args.get("entity_id", type=int)
    action = request.args.get("action")
    user_id = request.args.get("user_id", type=int)

    logs_page = AuditService.get_logs(
        page=page,
        per_page=per_page,
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action
    )

    return jsonify({
        "logs": [audit_to_dict(l) for l in logs_page.items],
        "pagination": {
            "page": logs_page.page,
            "per_page": logs_page.per_page,
            "total": logs_page.total,
            "pages": logs_page.pages
        }
    }), 200


# 2. GET SINGLE AUDIT LOG (Admin Only)
@audit_logs_bp.get("/<int:log_id>")
@roles_required("Administrator")
def get_audit_log(log_id):
    """
    Get detailed information about a single audit record.
    ---
    tags:
      - Audit & Compliance Logging
    summary: Get audit log by ID (Admin only)
    security:
      - Bearer: []
    parameters:
      - name: log_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Audit log record found.
      401:
        description: Authentication required.
      403:
        description: Administrator access required.
      404:
        description: Audit log record not found.
    """
    log = AuditService.get_by_id(log_id)
    if not log:
        return jsonify({"message": "Audit log record not found."}), 404

    return jsonify({
        "log": audit_to_dict(log)
    }), 200