/**
 * Parses and extracts clear, descriptive, human-readable error messages
 * from any backend API response, validation errors, or network issues.
 */
export const extractErrorMessage = (error, defaultMessage = 'Request failed. Please try again.') => {
  if (!error) return defaultMessage;

  // 1. Backend Marshmallow Field Validation Errors: { errors: { field: ["msg1", "msg2"] } }
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (typeof errors === 'object' && !Array.isArray(errors)) {
      const messages = Object.entries(errors).map(([field, errs]) => {
        const formattedField = field
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const msgList = Array.isArray(errs) ? errs.join(', ') : String(errs);
        return `${formattedField}: ${msgList}`;
      });
      return messages.join(' • ');
    } else if (Array.isArray(errors)) {
      return errors.join(' • ');
    }
  }

  // 2. Direct message property from backend API: { message: "..." }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // 3. Nested error object inside response payload: { error: { message: "..." } }
  if (error.response?.data?.error) {
    if (typeof error.response.data.error === 'string') {
      return error.response.data.error;
    }
    if (error.response.data.error?.message) {
      return error.response.data.error.message;
    }
  }

  // 4. HTTP status text fallbacks
  if (error.response?.status === 400) {
    return 'Invalid request details. Please check the entered fields and dates.';
  }
  if (error.response?.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (error.response?.status === 404) {
    return 'The requested resource could not be found.';
  }
  if (error.response?.status === 409) {
    return 'A scheduling or data conflict occurred. Please select different dates.';
  }
  if (error.response?.status >= 500) {
    return 'A server error occurred. Please try again in a few moments.';
  }

  // 5. Generic Axios / Network error message
  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};
