const test = require("node:test");
const assert = require("node:assert/strict");
const { validateSignup, validateLogin } = require("../src/validation/usersValidation");

test("signup accepts complete account details", () => {
  assert.equal(
    validateSignup({
      firstname: "Ada",
      lastname: "Lovelace",
      email: "ada@example.com",
      password: "correct-horse",
    }),
    null,
  );
});

test("signup rejects invalid email and short passwords", () => {
  assert.equal(
    validateSignup({ firstname: "Ada", lastname: "Lovelace", email: "bad", password: "12345678" }),
    "Please provide a valid email address",
  );
  assert.equal(
    validateSignup({ firstname: "Ada", lastname: "Lovelace", email: "ada@example.com", password: "short" }),
    "Password must be at least 8 characters",
  );
});

test("signup rejects missing names and bcrypt-incompatible passwords", () => {
  assert.equal(validateSignup({}), "First name and last name are required");
  assert.equal(validateSignup(null), "First name and last name are required");
  assert.equal(
    validateSignup({ firstname: "Ada", lastname: "Lovelace", email: "ada@example.com", password: "a".repeat(73) }),
    "Password must be no more than 72 bytes",
  );
});

test("login requires a valid email and a password", () => {
  assert.equal(validateLogin({ email: "ada@example.com", password: "x" }), null);
  assert.equal(validateLogin({ email: "ada@example.com" }), "Email and password are required");
  assert.equal(validateLogin(null), "Please provide a valid email address");
});