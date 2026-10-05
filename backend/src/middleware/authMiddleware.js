const jwt = require("jsonwebtoken");
const User = require("../models/user");
const AppError = require("../utils/AppError");

const protectRoute = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
            throw new AppError("Please sign in to access this resource", 401);
        }

        if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
            throw new AppError("Authentication is not securely configured", 500);
        }

        const token = authorization.replace(/^Bearer\s+/i, "");
        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ["HS256"],
            });
        } catch {
            throw new AppError("Your session is invalid or has expired", 401);
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            throw new AppError("The account for this session no longer exists", 401);
        }

        req.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
};

const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user) {
        return next(new AppError("Please sign in to access this resource", 401));
    }

    if (!roles.includes(req.user.role)) {
        return next(new AppError("You do not have permission to perform this action", 403));
    }

    return next();
};

module.exports = {
    protectRoute,
    restrictTo,
};