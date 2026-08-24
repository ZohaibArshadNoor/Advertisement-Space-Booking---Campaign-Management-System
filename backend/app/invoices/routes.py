from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError

from app.invoices import invoices_bp
from app.invoices.schemas import InvoiceCreateSchema, InvoiceStatusUpdateSchema
from app.services.invoice_service import InvoiceService
from app.common.decorators import roles_required
from app.models.user import User
from app.extensions import db

invoice_create_schema = InvoiceCreateSchema()
invoice_status_schema = InvoiceStatusUpdateSchema()


def invoice_to_dict(invoice, include_payments=False):
    data = {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "campaign_id": invoice.campaign_id,
        "campaign_name": invoice.campaign.name if invoice.campaign else None,
        "advertiser_id": invoice.advertiser_id,
        "advertiser_name": invoice.advertiser.company_name if invoice.advertiser else None,
        "subtotal": str(invoice.subtotal),
        "tax": str(invoice.tax),
        "total_amount": str(invoice.total_amount),
        "amount_paid": str(invoice.amount_paid),
        "balance_due": str(invoice.balance_due),
        "status": invoice.status,
        "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
        "issued_at": invoice.issued_at.isoformat() if invoice.issued_at else None,
        "created_at": invoice.created_at.isoformat() if invoice.created_at else None
    }

    if include_payments:
        data["payments"] = [
            {
                "id": p.id,
                "payment_reference": p.payment_reference,
                "amount": str(p.amount),
                "payment_method": p.payment_method,
                "status": p.status,
                "transaction_reference": p.transaction_reference,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None
            }
            for p in invoice.payments
        ]

    return data


# 1. CREATE INVOICE FOR CAMPAIGN
@invoices_bp.post("")
@roles_required("Administrator", "Finance Officer", "Sales Executive")
def create_invoice():
    """
    Generate an invoice for a campaign.
    ---
    tags:
      - Invoice & Billing Management
    summary: Create an invoice for a campaign
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - campaign_id
          properties:
            campaign_id:
              type: integer
              example: 1
            tax_rate:
              type: string
              example: "16.00"
            due_date:
              type: string
              format: date
              example: "2026-09-15"
    responses:
      201:
        description: Invoice generated successfully.
      400:
        description: Validation error or campaign not found.
    """
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    try:
        validated = invoice_create_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    invoice, error = InvoiceService.create_for_campaign(
        campaign_id=validated["campaign_id"],
        tax_rate=validated.get("tax_rate", "0.00"),
        due_date=validated.get("due_date"),
        advertiser_id=validated.get("advertiser_id")
    )

    if error:
        return jsonify({"message": error}), 400

    return jsonify({
        "message": "Invoice generated successfully.",
        "invoice": invoice_to_dict(invoice)
    }), 201


# 2. LIST INVOICES
@invoices_bp.get("")
@roles_required("Administrator", "Finance Officer", "Sales Executive", "Advertiser")
def get_invoices():
    """
    List invoices with pagination and filters.
    ---
    tags:
      - Invoice & Billing Management
    summary: List invoices
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
      - name: status
        in: query
        type: string
        enum: [DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED]
      - name: campaign_id
        in: query
        type: integer
      - name: search
        in: query
        type: string
        description: Keyword search on invoice number.
      - name: min_amount
        in: query
        type: number
      - name: max_amount
        in: query
        type: number
      - name: due_date_from
        in: query
        type: string
        format: date
      - name: due_date_to
        in: query
        type: string
        format: date
      - name: sort_by
        in: query
        type: string
        enum: [created_at, total_amount, due_date, status]
        default: created_at
      - name: sort_order
        in: query
        type: string
        enum: [asc, desc]
        default: desc
    responses:
      200:
        description: Invoices retrieved successfully.
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    status = request.args.get("status")
    campaign_id = request.args.get("campaign_id", type=int)
    search = request.args.get("search")
    min_amount = request.args.get("min_amount", type=float)
    max_amount = request.args.get("max_amount", type=float)
    due_date_from = request.args.get("due_date_from")
    due_date_to = request.args.get("due_date_to")
    sort_by = request.args.get("sort_by", default="created_at")
    sort_order = request.args.get("sort_order", default="desc")

    if page < 1:
        return jsonify({"message": "Page must be greater than zero."}), 400

    if per_page < 1 or per_page > 100:
        return jsonify({"message": "per_page must be between 1 and 100."}), 400

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    advertiser_filter = None
    if current_user and current_user.role.name == "Advertiser":
        advertiser_filter = current_user.advertiser_id

    invoices_page = InvoiceService.get_all(
        page=page,
        per_page=per_page,
        campaign_id=campaign_id,
        advertiser_id=advertiser_filter,
        status=status,
        search=search,
        min_amount=min_amount,
        max_amount=max_amount,
        due_date_from=due_date_from,
        due_date_to=due_date_to,
        sort_by=sort_by,
        sort_order=sort_order
    )

    return jsonify({
        "invoices": [invoice_to_dict(inv) for inv in invoices_page.items],
        "pagination": {
            "page": invoices_page.page,
            "per_page": invoices_page.per_page,
            "total": invoices_page.total,
            "pages": invoices_page.pages
        }
    }), 200


# 3. GET SINGLE INVOICE
@invoices_bp.get("/<int:invoice_id>")
@roles_required("Administrator", "Finance Officer", "Sales Executive", "Advertiser")
def get_invoice(invoice_id):
    """
    Get detailed invoice with payment history.
    ---
    tags:
      - Invoice & Billing Management
    summary: Get invoice by ID
    security:
      - Bearer: []
    parameters:
      - name: invoice_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Invoice retrieved successfully.
      404:
        description: Invoice not found.
    """
    invoice = InvoiceService.get_by_id(invoice_id)
    if not invoice:
        return jsonify({"message": "Invoice not found."}), 404

    current_user_id = int(get_jwt_identity())
    current_user = db.session.get(User, current_user_id)

    if current_user and current_user.role.name == "Advertiser":
        if invoice.advertiser_id != current_user.advertiser_id:
            return jsonify({"message": "You do not have permission to view this invoice."}), 403

    return jsonify({
        "invoice": invoice_to_dict(invoice, include_payments=True)
    }), 200


# 4. UPDATE INVOICE STATUS
@invoices_bp.patch("/<int:invoice_id>/status")
@roles_required("Administrator", "Finance Officer")
def update_invoice_status(invoice_id):
    """
    Update invoice status manually.
    ---
    tags:
      - Invoice & Billing Management
    summary: Update invoice status
    security:
      - Bearer: []
    parameters:
      - name: invoice_id
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
              enum: [DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED]
    responses:
      200:
        description: Status updated.
      400:
        description: Invalid status value.
      404:
        description: Invoice not found.
    """
    invoice = InvoiceService.get_by_id(invoice_id)
    if not invoice:
        return jsonify({"message": "Invoice not found."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    try:
        validated = invoice_status_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    updated, error = InvoiceService.update_status(invoice, validated["status"])
    if error:
        return jsonify({"message": error}), 400

    return jsonify({
        "message": f"Invoice status updated to {validated['status']}.",
        "invoice": invoice_to_dict(updated)
    }), 200