const AppError = require("../utils/AppError");

const handleDuplicateError = (err) => {
  const duplicateKey = Object.keys(err.keyValue || {})[0];
  const message = duplicateKey
    ? `Duplicate ${duplicateKey}: "${err.keyValue[duplicateKey]}" already exists`
    : "A record with these details already exists";
  return new AppError(message, 400);
};

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError("Invalid token. Please login again", 401);
};

const handleJWTExpiredError = () => {
  return new AppError("Your token has expired. Please login again", 401);
};

const errorHandler = (err, req, res, next) => {
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

  const statusCode = error.statusCode || error.status || 500;
  const message = error.isOperational || process.env.NODE_ENV !== "production"
    ? error.message
    : "Something went wrong";

  return res.status(statusCode).json({
    status: statusCode >= 500 ? "error" : "fail",
    message,
  });
};

module.exports = errorHandler;