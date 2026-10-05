const Users = require("../models/user.js");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError.js");

const protectRoute = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You're not logged in, please login", 401)
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Users.findById(decoded.id);

    if (!user) {
      return next(
        new AppError("User with specified ID not found", 404)
      );
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You are not authorized to access this route",
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  protectRoute,
  restrictTo,
};