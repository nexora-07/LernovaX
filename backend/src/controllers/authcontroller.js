const bcrypt = require("bcryptjs");
const crypto = require("crypto");
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
  instructorId: user.instructorId,
  adminId: user.adminId,
  createdAt: user.createdAt,
});

const normalizeId = (id) => id.trim().toUpperCase();

const configuredCodeMatches = (providedCode, configuredCode) => {
  if (typeof configuredCode !== "string" || Buffer.byteLength(configuredCode, "utf8") < 32) {
    throw new AppError("Role signup is not securely configured", 500);
  }

  const provided = Buffer.from(providedCode);
  const configured = Buffer.from(configuredCode);
  return provided.length === configured.length && crypto.timingSafeEqual(provided, configured);
};

const signupForRole = (role, idField, codeEnvironmentVariable) => async (req, res, next) => {
  try {
    const validationError = validateSignup(req.body, role);
    if (validationError) {
      throw new AppError(validationError, 400);
    }

    if (role !== "student" && !configuredCodeMatches(
      req.body.signupCode,
      process.env[codeEnvironmentVariable],
    )) {
      throw new AppError("Invalid role signup code", 403);
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
      role,
      ...(idField ? { [idField]: normalizeId(req.body[idField]) } : {}),
    });

    return res.status(201).json({
      status: "success",
      data: {
        user: toPublicUser(user),
        token: signJwt(user._id),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      const message = duplicateField === "instructorId"
        ? "An account with this Instructor ID already exists"
        : duplicateField === "adminId"
          ? "An account with this Admin ID already exists"
          : "An account with this email already exists";
      return next(new AppError(message, 409));
    }

    return next(error);
  }
};

const loginForRole = (role, idField) => async (req, res, next) => {
  try {
    const validationError = validateLogin(req.body, role);
    if (validationError) {
      throw new AppError(validationError, 400);
    }

    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
      throw new AppError("Authentication is not securely configured", 500);
    }

    const email = req.body.email.trim().toLowerCase();
    const lookup = { email, role };
    if (idField) {
      lookup[idField] = normalizeId(req.body[idField]);
    }
    const user = await User.findOne(lookup).select("+password");
    const passwordIsValid = user && await bcrypt.compare(req.body.password, user.password);

    if (!passwordIsValid) {
      throw new AppError("Incorrect email or password", 401);
    }

    return res.status(200).json({
      status: "success",
      data: {
        user: toPublicUser(user),
        token: signJwt(user._id),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const signup = signupForRole("student");
const signupInstructor = signupForRole(
  "instructor",
  "instructorId",
  "INSTRUCTOR_SIGNUP_CODE",
);
const signupAdmin = signupForRole("admin", "adminId", "ADMIN_SIGNUP_CODE");
const login = loginForRole("student");
const loginInstructor = loginForRole("instructor", "instructorId");
const loginAdmin = loginForRole("admin", "adminId");

const getCurrentUser = (req, res) => {
  res.status(200).json({
    status: "success",
    data: { user: toPublicUser(req.user) },
  });
};

module.exports = {
  signup,
  signupInstructor,
  signupAdmin,
  login,
  loginInstructor,
  loginAdmin,
  getCurrentUser,
};
