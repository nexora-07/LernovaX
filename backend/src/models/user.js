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
      unique: [true, "Email must be unique"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minLength: [8, "password must be at least 8 in characters"],
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
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("user", userSchema);
