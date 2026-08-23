from flask import jsonify, request
from marshmallow import ValidationError

from app.payments import payments_bp
from app.payments.schemas import PaymentCreateSchema, PaymentStatusUpdateSchema
from app.services.payment_service import PaymentService
from app.common.decorators import roles_required

payment_create_schema = PaymentCreateSchema()
payment_status_schema = PaymentStatusUpdateSchema()


def payment_to_dict(payment):
    return {
        "id": payment.id,
        "payment_reference": payment.payment_reference,
        "invoice_id": payment.invoice_id,
        "invoice_number": payment.invoice.invoice_number if payment.invoice else None,
        "amount": str(payment.amount),
        "payment_method": payment.payment_method,
        "transaction_reference": payment.transaction_reference,
        "status": payment.status,
        "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
        "created_at": payment.created_at.isoformat() if payment.created_at else None
    }


# 1. RECORD PAYMENT
@payments_bp.post("")
@roles_required("Administrator", "Finance Officer")
def record_payment():
    """
    Record a payment transaction against an invoice.
    ---
    tags:
      - Payments & Transactions
    summary: Record a payment
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - invoice_id
            - amount
          properties:
            invoice_id:
              type: integer
              example: 1
            amount:
              type: string
              example: "500000.00"
            payment_method:
              type: string
              enum: [BANK_TRANSFER, CREDIT_CARD, CHEQUE, CASH, ONLINE]
              example: "BANK_TRANSFER"
            transaction_reference:
              type: string
              example: "HBL-TRX-98234"
    responses:
      201:
        description: Payment recorded and invoice reconciled.
      400:
        description: Validation error or fully paid invoice.
    """
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    try:
        validated = payment_create_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    payment, error = PaymentService.record_payment(
        invoice_id=validated["invoice_id"],
        amount=validated["amount"],
        payment_method=validated.get("payment_method", "BANK_TRANSFER"),
        transaction_reference=validated.get("transaction_reference")
    )

    if error:
        return jsonify({"message": error}), 400

    return jsonify({
        "message": "Payment recorded successfully and invoice balance updated.",
        "payment": payment_to_dict(payment)
    }), 201


# 2. LIST PAYMENTS
@payments_bp.get("")
@roles_required("Administrator", "Finance Officer", "Sales Executive")
def get_payments():
    """
    List all payment transactions with pagination.
    ---
    tags:
      - Payments & Transactions
    summary: List payments
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
        default: 10
      - name: invoice_id
        in: query
        type: integer
      - name: status
        in: query
        type: string
        enum: [PENDING, COMPLETED, FAILED, REFUNDED]
    responses:
      200:
        description: Payments retrieved.
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    invoice_id = request.args.get("invoice_id", type=int)
    status = request.args.get("status")

    payments_page = PaymentService.get_all(
        page=page,
        per_page=per_page,
        invoice_id=invoice_id,
        status=status
    )

    return jsonify({
        "payments": [payment_to_dict(p) for p in payments_page.items],
        "pagination": {
            "page": payments_page.page,
            "per_page": payments_page.per_page,
            "total": payments_page.total,
            "pages": payments_page.pages
        }
    }), 200


# 3. GET SINGLE PAYMENT
@payments_bp.get("/<int:payment_id>")
@roles_required("Administrator", "Finance Officer", "Sales Executive")
def get_payment(payment_id):
    """
    Get payment transaction details.
    ---
    tags:
      - Payments & Transactions
    summary: Get payment by ID
    security:
      - Bearer: []
    parameters:
      - name: payment_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Payment found.
      404:
        description: Payment not found.
    """
    payment = PaymentService.get_by_id(payment_id)
    if not payment:
        return jsonify({"message": "Payment not found."}), 404

    return jsonify({"payment": payment_to_dict(payment)}), 200


# 4. UPDATE PAYMENT STATUS
@payments_bp.patch("/<int:payment_id>/status")
@roles_required("Administrator", "Finance Officer")
def update_payment_status(payment_id):
    """
    Update payment status (e.g. COMPLETED -> REFUNDED).
    ---
    tags:
      - Payments & Transactions
    summary: Update payment status
    security:
      - Bearer: []
    parameters:
      - name: payment_id
        in: path
        type: integer
        required: true
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
              enum: [PENDING, COMPLETED, FAILED, REFUNDED]
    responses:
      200:
        description: Payment status updated and invoice balance recalculated.
      400:
        description: Invalid status value.
      404:
        description: Payment not found.
    """
    payment = PaymentService.get_by_id(payment_id)
    if not payment:
        return jsonify({"message": "Payment not found."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    try:
        validated = payment_status_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    updated, error = PaymentService.update_status(payment, validated["status"])
    if error:
        return jsonify({"message": error}), 400

    return jsonify({
        "message": f"Payment status updated to {validated['status']}.",
        "payment": payment_to_dict(updated)
    }), 200