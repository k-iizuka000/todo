const { StatusCodes } = require('http-status-codes');

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends ApiError {
  constructor(message) {
    super(StatusCodes.BAD_REQUEST, message);
  }
}

class AuthenticationError extends ApiError {
  constructor(message = '認証が必要です') {
    super(StatusCodes.UNAUTHORIZED, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'リソースが見つかりません') {
    super(StatusCodes.NOT_FOUND, message);
  }
}

module.exports = {
  ApiError,
  ValidationError,
  AuthenticationError,
  NotFoundError
}; 