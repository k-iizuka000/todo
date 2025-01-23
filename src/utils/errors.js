import { StatusCodes } from 'http-status-codes';

export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  constructor(message) {
    super(StatusCodes.BAD_REQUEST, message);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = '認証が必要です') {
    super(StatusCodes.UNAUTHORIZED, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'リソースが見つかりません') {
    super(StatusCodes.NOT_FOUND, message);
  }
} 