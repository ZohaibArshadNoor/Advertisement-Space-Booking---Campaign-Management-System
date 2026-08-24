import logging
from flask import jsonify, request
from werkzeug.exceptions import HTTPException
from marshmallow import ValidationError as MarshmallowValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.errors.exceptions import AppException

logger = logging.getLogger(__name__)


def make_error_response(message: str, error_code: str, status_code: int, details: dict = None):
    """
    Standardized API Error Response Schema.
    """
    response_body = {
        "success": False,
        "message": message,
        "error": {
            "code": error_code
        }
    }
    if details:
        response_body["error"]["details"] = details

    return jsonify(response_body), status_code


def register_error_handlers(app):
    """
    Registers centralized error handlers on the Flask application instance.
    """

    # 1. Custom Application Exceptions
    @app.errorhandler(AppException)
    def handle_app_exception(err):
        return make_error_response(
            message=err.message,
            error_code=err.error_code,
            status_code=err.status_code,
            details=err.details
        )

    # 2. Marshmallow Validation Errors (Schema validation failures)
    @app.errorhandler(MarshmallowValidationError)
    def handle_marshmallow_validation(err):
        return make_error_response(
            message="Request validation failed. Please correct the invalid fields.",
            error_code="VALIDATION_ERROR",
            status_code=400,
            details=err.messages
        )

    # 3. Standard Werkzeug HTTP Exceptions (e.g. 404, 405, 400)
    @app.errorhandler(HTTPException)
    def handle_http_exception(err):
        error_code_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            422: "UNPROCESSABLE_ENTITY",
            500: "INTERNAL_SERVER_ERROR"
        }
        error_code = error_code_map.get(err.code, "HTTP_ERROR")
        return make_error_response(
            message=err.description or "HTTP request error.",
            error_code=error_code,
            status_code=err.code
        )

    # 4. Database SQLAlchemy Errors (Guarantees transaction rollback and masks internals)
    @app.errorhandler(SQLAlchemyError)
    def handle_sqlalchemy_error(err):
        db.session.rollback()
        logger.error(f"Database Exception at {request.method} {request.path}: {str(err)}", exc_info=True)
        return make_error_response(
            message="A database error occurred. The transaction has been rolled back safely.",
            error_code="DATABASE_ERROR",
            status_code=500
        )

    # 5. Global Unhandled Exceptions (Prevents crash leaks)
    @app.errorhandler(Exception)
    def handle_generic_exception(err):
        db.session.rollback()
        logger.error(f"Unhandled Exception at {request.method} {request.path}: {str(err)}", exc_info=True)
        return make_error_response(
            message="An internal server error occurred. Our engineering team has been notified.",
            error_code="INTERNAL_SERVER_ERROR",
            status_code=500
        )
