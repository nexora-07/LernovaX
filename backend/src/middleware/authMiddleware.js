const jwt = require("jsonwebtoken");
const User = require("../models/user");
const AppError = require("../utils/AppError");

const protectRoute = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            throw new AppError("Please sign in to access this resource", 401);
        }

        const token = authorization.split(" ")[1];
        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            throw new AppError("Your session is invalid or has expired", 401);
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            throw new AppError("The account for this session no longer exists", 401);
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return next(new AppError("You do not have permission to perform this action", 403));
    }

    next();
};

module.exports = {
    protectRoute,
    restrictTo,
};