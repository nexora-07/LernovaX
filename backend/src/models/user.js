const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "Please provide firstname"],
      trim: true,
    },

    lastname: {
      type: String,
      required: [true, "Please provide lastname"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: [8, "Password must be at least 8 characters"],
      trim: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },

    instructorId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    adminId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailOtp: {
      type: String,
    },

    emailOtpExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("user", userSchema);
