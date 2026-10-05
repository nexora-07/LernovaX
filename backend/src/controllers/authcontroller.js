const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const AppError = require("../utils/AppError");

const signup = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error("Email already exists");
    } 

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      role: "student",
    });

    user.password = undefined;

    res.status(201).json({
      status: "successful",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string") {
      return next(new AppError("Please provide an email and password", 400));
    }

    if (!process.env.JWT_SECRET) {
      return next(new Error("JWT_SECRET is not configured"));
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "7d" },
    );
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      status: "successful",
      token,
      data: {
        user: userData,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
};