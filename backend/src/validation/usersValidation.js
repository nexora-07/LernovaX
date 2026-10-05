const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const validateSignup = (body = {}) => {
  body = body || {};
  const { firstname, lastname, email, password } = body;

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

  return null;
};

const validateLogin = (body = {}) => {
  body = body || {};
  const { email, password } = body;

  if (!isNonEmptyString(email) || !isValidEmail(email)) {
    return "Please provide a valid email address";
  }
  if (typeof password !== "string" || password.length === 0) {
    return "Email and password are required";
  }

  return null;
};

module.exports = { validateSignup, validateLogin };