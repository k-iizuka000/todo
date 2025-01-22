const { StatusCodes } = require('http-status-codes');

// Custom error handler middleware
const errorHandlerMiddleware = (err, req, res, next) => {
  // Default error object
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message || 'Something went wrong, please try again later'
  };

  // Handle validation errors
  if (err.name === 'ValidationError') {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.message = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');
  }

  // Handle duplicate key errors
  if (err.code && err.code === 11000) {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.message = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field`;
  }

  // Return standardized error response
  return res.status(customError.statusCode).json({
    success: false,
    error: customError.message
  });
};

class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // 本番環境ではスタックトレースを含めない
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
};

module.exports = {
  AppError,
  errorHandler
};