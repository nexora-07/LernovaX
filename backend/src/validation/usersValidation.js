const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const validateSignup = (body = {}, role = "student") => {
  body = body || {};
  const { firstname, lastname, email, password, confirmPassword } = body;

  if (!isNonEmptyString(firstname) || !isNonEmptyString(lastname)) {
    return "First name and last name are required";
  }
  if (!isNonEmptyString(email) || !isValidEmail(email)) {
    return "Please provide a valid email address";
  }
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return "Password must be no more than 72 bytes";
  }
  if (typeof confirmPassword !== "string" || password !== confirmPassword) {
    return "Passwords do not match";
  }
  if (role === "instructor" && !isNonEmptyString(body.instructorId)) {
    return "Instructor ID is required";
  }
  if (role === "admin" && !isNonEmptyString(body.adminId)) {
    return "Admin ID is required";
  }
  if (role !== "student" && role !== "instructor" && role !== "admin") {
    return "Invalid account role";
  }
  if (role !== "student" && !isNonEmptyString(body.signupCode)) {
    return "Signup code is required";
  }

  return null;
};

const validateLogin = (body = {}, role = "student") => {
  body = body || {};
  const { email, password } = body;

  if (!isNonEmptyString(email) || !isValidEmail(email)) {
    return "Please provide a valid email address";
  }
  if (typeof password !== "string" || password.length === 0) {
    return "Email and password are required";
  }
  if (role === "instructor" && !isNonEmptyString(body.instructorId)) {
    return "Instructor ID is required";
  }
  if (role === "admin" && !isNonEmptyString(body.adminId)) {
    return "Admin ID is required";
  }
  if (role !== "student" && role !== "instructor" && role !== "admin") {
    return "Invalid account role";
  }

  return null;
};

module.exports = { validateSignup, validateLogin };