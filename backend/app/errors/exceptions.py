class AppException(Exception):
    """
    Base application exception for standardized error handling.
    """
    status_code = 500
    error_code = "INTERNAL_SERVER_ERROR"

    def __init__(self, message="An unexpected error occurred.", status_code=None, error_code=None, details=None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if error_code is not None:
            self.error_code = error_code
        self.details = details or {}


class BadRequestError(AppException):
    status_code = 400
    error_code = "BAD_REQUEST"


class ValidationError(AppException):
    status_code = 422
    error_code = "VALIDATION_ERROR"


class UnauthorizedError(AppException):
    status_code = 401
    error_code = "UNAUTHORIZED"


class ForbiddenError(AppException):
    status_code = 403
    error_code = "FORBIDDEN"


class NotFoundError(AppException):
    status_code = 404
    error_code = "NOT_FOUND"


class ConflictError(AppException):
    """
    Specifically for scheduling overlaps and business state conflicts.
    """
    status_code = 409
    error_code = "CONFLICT"


class BusinessLogicError(AppException):
    status_code = 400
    error_code = "BUSINESS_LOGIC_ERROR"
