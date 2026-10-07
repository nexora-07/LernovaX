const bcrypt = require("bcryptjs");
const User = require("../models/user");
const AppError = require("../utils/AppError");
const signJwt = require("../utils/signJWT");
const generateOTP = require("../utils/generateOTP");
const sendOTPEmail = require("../utils/sendOTPEmail");
const {
  validateSignup,
  validateLogin,
} = require("../validation/usersValidation");

const toPublicUser = (user) => ({
  id: user._id,
  firstname: user.firstname,
  lastname: user.lastname,
  email: user.email,
  phone: user.phone,
  role: user.role,
  instructorId: user.instructorId,
  adminId: user.adminId,
  createdAt: user.createdAt,
});

const normalizeId = (id) => id.trim().toUpperCase();

const signup = async (req, res, next) => {
  try {
    const validationError = validateSignup(req.body, "student");

    if (validationError) {
      throw new AppError(validationError, 400);
    }

    const { firstname, lastname, email, phone, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: phone.trim() }],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        throw new AppError("An account with this email already exists", 409);
      }

      throw new AppError(
        "An account with this phone number already exists",
        409,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();

    const user = await User.create({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "student",
      emailOtp: otp,
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTPEmail(user.email, otp);

    return res.status(201).json({
      status: "success",
      message:
        "Account created successfully. Please check your email for your verification code.",
      data: {
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new AppError("An account with this email or phone already exists", 409),
      );
    }

    return next(error);
  }
};

const signupInstructor = async (req, res, next) => {
  try {
    const validationError = validateSignup(req.body, "instructor");

    if (validationError) {
      throw new AppError(validationError, 400);
    }

    const { firstname, lastname, email, phone, password, instructorId } =
      req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedInstructorId = normalizeId(instructorId);

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: phone.trim() },
        { instructorId: normalizedInstructorId },
      ],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        throw new AppError("An account with this email already exists", 409);
      }

      if (existingUser.phone === phone.trim()) {
        throw new AppError(
          "An account with this phone number already exists",
          409,
        );
      }

      throw new AppError(
        "An account with this Instructor ID already exists",
        409,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();

    const user = await User.create({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "instructor",
      instructorId: normalizedInstructorId,
      emailOtp: otp,
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTPEmail(user.email, otp);

    return res.status(201).json({
      status: "success",
      message:
        "Instructor account created successfully. Please check your email for your verification code.",
      data: {
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new AppError(
          "An account with this email, phone, or Instructor ID already exists",
          409,
        ),
      );
    }

    return next(error);
  }
};

const signupAdmin = async (req, res, next) => {
  try {
    const validationError = validateSignup(req.body, "admin");

    if (validationError) {
      throw new AppError(validationError, 400);
    }

    const { firstname, lastname, email, phone, password, adminId } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedAdminId = normalizeId(adminId);

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: phone.trim() },
        { adminId: normalizedAdminId },
      ],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        throw new AppError("An account with this email already exists", 409);
      }

      if (existingUser.phone === phone.trim()) {
        throw new AppError(
          "An account with this phone number already exists",
          409,
        );
      }

      throw new AppError("An account with this Admin ID already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();

    const user = await User.create({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "admin",
      adminId: normalizedAdminId,
      emailOtp: otp,
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTPEmail(user.email, otp);

    return res.status(201).json({
      status: "success",
      message:
        "Admin account created successfully. Please check your email for your verification code.",
      data: {
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new AppError(
          "An account with this email, phone, or Admin ID already exists",
          409,
        ),
      );
    }

    return next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError("Email and OTP are required", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.emailVerified) {
      throw new AppError("Email is already verified", 400);
    }

    if (!user.emailOtp || !user.emailOtpExpires) {
      throw new AppError("No verification code found", 400);
    }

    if (new Date() > user.emailOtpExpires) {
      throw new AppError(
        "Verification code has expired. Please request a new one",
        400,
      );
    }

    if (user.emailOtp !== otp.trim()) {
      throw new AppError("Invalid verification code", 400);
    }

    user.emailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;

    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validationError = validateLogin(req.body, "student");

    if (validationError) {
      throw new AppError(validationError, 400);
    }

    const email = req.body.email.trim().toLowerCase();

    const user = await User.findOne({
      email,
      role: "student",
    }).select("+password");

    if (!user) {
      throw new AppError("Incorrect email or password", 401);
    }

    const passwordIsValid = await bcrypt.compare(
      req.body.password,
      user.password,
    );

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

const loginInstructor = async (req, res, next) => {
  try {
    const validationError = validateLogin(req.body, "instructor");

    if (validationError) {
      throw new AppError(validationError, 400);
    }

    const email = req.body.email.trim().toLowerCase();
    const instructorId = normalizeId(req.body.instructorId);

    const user = await User.findOne({
      email,
      role: "instructor",
      instructorId,
    }).select("+password");

    if (!user) {
      throw new AppError("Incorrect email, password, or Instructor ID", 401);
    }

    const passwordIsValid = await bcrypt.compare(
      req.body.password,
      user.password,
    );

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

const loginAdmin = async (req, res, next) => {
  try {
    const validationError = validateLogin(req.body, "admin");

    if (validationError) {
      throw new AppError(validationError, 400);
    }

    const email = req.body.email.trim().toLowerCase();
    const adminId = normalizeId(req.body.adminId);

    const user = await User.findOne({
      email,
      role: "admin",
      adminId,
    }).select("+password");

    if (!user) {
      throw new AppError("Incorrect email, password, or Admin ID", 401);
    }

    const passwordIsValid = await bcrypt.compare(
      req.body.password,
      user.password,
    );

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

const getCurrentUser = (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: toPublicUser(req.user),
    },
  });
};

module.exports = {
  signup,
  signupInstructor,
  signupAdmin,
  verifyEmail,
  login,
  loginInstructor,
  loginAdmin,
  getCurrentUser,
};
