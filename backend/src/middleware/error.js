const AppError = require("../utils/AppError");

// Duplicate value error
const handleDuplicateError = (err) => {
  const dupKey = Object.keys(err.keyValue)[0];
  const dupValue = Object.values(err.keyValue)[0];

  const message = `Duplicate ${dupKey}: "${dupValue}" already exists`;

  return new AppError(message, 400);
};

// Invalid MongoDB ID
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

// Mongoose validation error
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(
    (el) => el.message
  );

  const message = `Invalid input data: ${errors.join(". ")}`;

  return new AppError(message, 400);
};

// Invalid JWT
const handleJWTError = () => {
  return new AppError(
    "Invalid token. Please login again",
    401
  );
};

// Expired JWT
const handleJWTExpiredError = () => {
  return new AppError(
    "Your token has expired. Please login again",
    401
  );
};

// Development error response
const sendDevError = (err, res) => {
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    status: err.status || "error",
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

// Production error response
const sendProdError = (err, res) => {
  // Operational errors are safe to send to the user
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or unknown errors
  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    return sendDevError(err, res);
  }

  let error = err;

  if (err.type === "entity.too.large") {
    error = new AppError("Request body is too large", 413);
  } else if (err.code === 11000) {
    error = handleDuplicateError(err);
  } else if (err.name === "CastError") {
    error = handleCastError(err);
  } else if (err.name === "ValidationError") {
    error = handleValidationError(err);
  } else if (err.name === "JsonWebTokenError") {
    error = handleJWTError();
  } else if (err.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  }

  return sendProdError(error, res);
};

module.exports = errorHandler;