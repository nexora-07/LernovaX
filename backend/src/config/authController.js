const Users = require("../models/user");
const {
  validationUserSignup,
  validationUserLogin,
} = require("../validation/usersValidation");
const signJwt = require("../utils/signJWT");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/AppError");
const sendEmail = require("../utils/email");
const crypto = require("crypto");

const signUp = async (req, res, next) => {
  try {
    const validation = validationUserSignup(req.body);

    if (validation.error) {
      throw new AppError(validation?.error.message, 400);
    }

    const { firstname, lastname, email, password } = req.body;

    //check if user already exist

    const existingUser = await Users.findOne({ email });

    if (existingUser) {
      throw new AppError("User with email already exist");
    }

    //Hashing of password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create user
    const user = await Users.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    if (!user) {
      throw new AppError("Failed to create user");
    }

    //Send mail verification

    const options = {
      email: email,
      subject:
        "Welcome to SQI AUGUST Ecommerce platform, where product price get better",
      message:
        "Welcome onboard. We are pleased to have you. Shop Now, get better price.",
    };

    await sendEmail(options);

    //Create verification token

    const verificationToken = crypto.randomBytes(32).toString("hex");

    //hash verification token

    const hashedVerficationToken = await bcrypt.hash(verificationToken, salt);

    //create verificationUrl

    const verificationUrl = `${req.protocol}://${req.get(
      "host",
    )}/api/v1/auth/verify/${user.email}/${verificationToken}`;

    //create verification message

    const verificationMessage = `Please click on the verification link to verify your email. \n ${verificationUrl}`;

    const verificationMailOptions = {
      email: email,
      subject: "Verify your email address",
      message: verificationMessage,
    };

    await sendEmail(verificationMailOptions);

    user.verification_token = hashedVerficationToken;

    await user.save();

    const token = signJwt(user._id);

    res.status(201).json({
      status: "succesful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmailAddress = async (req, res, next) => {
  try {
    const { email, verificationToken } = req.params;

    if (!email || !verificationToken) {
      throw new AppError("Please provide email and token");
    }

    //check if email exist

    const user = await Users.findOne({ email });

    if (!user) {
      throw new AppError("User Not Found!");
    }

    const tokenValid = await bcrypt.compare(
      verificationToken,
      user.verification_token,
    );

    if (!tokenValid) {
      throw new AppError("Failed to verify user - Invalid token");
    }

    user.email_verified = true;

    await user.save();

    res.status(201).json({
      status: "successful",
      message: "User verified succesfully",
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
    const validation = validationUserLogin(req.body);

    if (validation.error) {
      throw new AppError(validation.error.message, 400);
    }

    const { email, password } = req.body;

    const user = await Users.findOne({ email }).select("+password");

    if (!user) {
      throw new AppError("Incorrect email or password", 401);
    }

    if (!user.email_verified) {
      throw new AppError("kindly verify email", 401);

    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      throw new AppError("Incorrect email or password", 401);
    }

    const token = signJwt(user._id);
    user.password = undefined;

    res.status(200).json({
      status: "successful",
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Please provide your email", 403);
    }

    const existingUser = await Users.findOne({ email });
    if (!existingUser) {
      throw new AppError("User with email does not exsit", 400);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 10 * 60 * 1000;

    const salt = await bcrypt.genSalt(10);
    const hashedResetToken = await bcrypt.hash(resetToken, salt);

    existingUser.reset_password_token = hashedResetToken;
    existingUser.reset_password_expires = resetTokenExpiry;

    await existingUser.save();

    // Build a URL that matches the verify route signature.
    const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/forgetpassword/${existingUser.email}/${resetToken}`;
    const resetMessage = `Please click on this link to reset password. \n ${resetUrl}`;

    const resetMailOptions = {
      email: email,
      subject: "Please reset your password",
      message: resetMessage,
    };

    await sendEmail(resetMailOptions);

    res.status(200).json({
      status: "success",
      message: "Reset password link has been sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

const verifyResetToken = async (req, res, next) => {
  try {
    const { email, resetToken } = req.params;

    console.log(resetToken)

    if (!email || !resetToken) {
      throw new AppError("Please provide email and token", 400);
    }

    const user = await Users.findOne({ email }).select("+reset_password_token");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const tokenValid = await bcrypt.compare(resetToken, user.reset_password_token);

    if (!tokenValid) {
      throw new AppError("Failed to verify user - Invalid token", 401);
    }

    res.status(201).json({
      status: "Successful",
      message: "Token verified successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken } = req.params;
    const { password } = req.body;

    if (!email || !resetToken || !password) {
      throw new AppError("Please provide email, token and new password", 400);
    }

    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400);
    }

    const user = await Users.findOne({ email }).select("+reset_password_token");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.reset_password_token) {
      throw new AppError("Reset token is invalid", 400);
    }

    if (
      !user.reset_password_expires ||
      new Date(user.reset_password_expires).getTime() < Date.now()
    ) {
      throw new AppError("Reset token has expired. Request another one", 400);
    }

    const tokenValid = await bcrypt.compare(resetToken, user.reset_password_token);

    if (!tokenValid) {
      throw new AppError("Failed to reset password - Invalid token", 401);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;

    await user.save();

    const token = signJwt(user._id);
    user.password = undefined;

    res.status(200).json({
      status: "successful",
      message: "Password reset successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};





module.exports = {
  signUp,
  login,
  forgetPassword,
  verifyEmailAddress,
  verifyResetToken,
  resetPassword,
};
