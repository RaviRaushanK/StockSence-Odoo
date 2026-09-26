class ApiError extends Error {
  constructor(statusCode, message, { code = 'ERROR', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, { code: 'BAD_REQUEST', details });
  }

  static unauthorized(message = 'Authentication required.') {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'You do not have permission to perform this action.') {
    return new ApiError(403, message, { code: 'FORBIDDEN' });
  }

  static notFound(message = 'Resource not found.') {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }

  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, message, { code });
  }

  static unprocessable(message, details) {
    return new ApiError(422, message, { code: 'VALIDATION_ERROR', details });
  }

  static serviceUnavailable(message, code = 'SERVICE_UNAVAILABLE') {
    return new ApiError(503, message, { code });
  }
}

module.exports = ApiError;
