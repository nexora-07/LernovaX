const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const AppError = require("../utils/AppError");
const signJwt = require("../utils/signJWT");
const { validateSignup, validateLogin } = require("../validation/usersValidation");

const toPublicUser = (user) => ({
  id: user._id,
  firstname: user.firstname,
  lastname: user.lastname,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const signup = async (req, res, next) => {
  try {
    const validationError = validateSignup(req.body);
    if (validationError) {
      throw new AppError(validationError, 400);
    }

    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
      throw new AppError("Authentication is not securely configured", 500);
    }

    const { firstname, lastname, email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw new AppError("An account with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "student",
    });

    res.status(201).json({
      status: "success",
      data: {
        user: toPublicUser(user),
        token: signJwt(user._id),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("An account with this email already exists", 409));
    }

    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validationError = validateLogin(req.body);
    if (validationError) {
      throw new AppError(validationError, 400);
    }

    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
      throw new AppError("Authentication is not securely configured", 500);
    }

    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email }).select("+password");
    const passwordIsValid = user && await bcrypt.compare(req.body.password, user.password);

    if (!passwordIsValid) {
      throw new AppError("Incorrect email or password", 401);
    }

    res.status(200).json({
      status: "success",
      data: {
        user: toPublicUser(user),
        token: signJwt(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = (req, res) => {
  res.status(200).json({
    status: "success",
    data: { user: toPublicUser(req.user) },
  });
};

module.exports = {
  signup,
  login,
  getCurrentUser,
};
