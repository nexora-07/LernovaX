require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../src/models/user");
const connectDB = require("../src/config/db");

const requiredFields = [
  "ADMIN_BOOTSTRAP_FIRSTNAME",
  "ADMIN_BOOTSTRAP_LASTNAME",
  "ADMIN_BOOTSTRAP_EMAIL",
  "ADMIN_BOOTSTRAP_PHONE",
  "ADMIN_BOOTSTRAP_ID",
  "ADMIN_BOOTSTRAP_PASSWORD",
];

const createFirstAdmin = async () => {
  const missingFields = requiredFields.filter(
    (field) => !process.env[field]?.trim(),
  );

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required environment values: ${missingFields.join(", ")}`,
    );
  }

  const firstname = process.env.ADMIN_BOOTSTRAP_FIRSTNAME.trim();
  const lastname = process.env.ADMIN_BOOTSTRAP_LASTNAME.trim();
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL.trim().toLowerCase();
  const phone = process.env.ADMIN_BOOTSTRAP_PHONE.trim();
  const adminId = process.env.ADMIN_BOOTSTRAP_ID.trim().toUpperCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_BOOTSTRAP_EMAIL must be a valid email address");
  }

  if (!/^[0-9+\-\s()]{10,15}$/.test(phone)) {
    throw new Error("ADMIN_BOOTSTRAP_PHONE must be a valid phone number");
  }

  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Admin password must be at least 8 characters and at most 72 UTF-8 bytes");
  }

  if (!(await connectDB())) {
    throw new Error("Could not connect to the database; check MONGODB_URL");
  }

  const existingAdmin = await User.exists({ role: "admin" });

  if (existingAdmin) {
    throw new Error("An admin account already exists; bootstrap is only for the first admin");
  }

  const existingAccount = await User.findOne({
    $or: [{ email }, { phone }, { adminId }],
  }).select("email phone adminId");

  if (existingAccount) {
    throw new Error("The email, phone number, or admin ID is already in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    firstname,
    lastname,
    email,
    phone,
    password: hashedPassword,
    role: "admin",
    adminId,
    emailVerified: true,
  });

  console.log(`Initial admin ${adminId} created successfully.`);
};

createFirstAdmin()
  .catch((error) => {
    console.error(`Admin bootstrap failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
