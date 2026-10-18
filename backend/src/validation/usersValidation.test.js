const test = require("node:test");
const assert = require("node:assert/strict");

const { validateLogin } = require("./usersValidation");

test("instructor login requires only instructor ID and password", () => {
  assert.equal(
    validateLogin(
      { instructorId: " ins-123 ", password: "secret" },
      "instructor",
    ),
    null,
  );
});

test("instructor login rejects a missing ID or password", () => {
  assert.equal(
    validateLogin({ password: "secret" }, "instructor"),
    "Instructor ID is required",
  );
  assert.equal(
    validateLogin({ instructorId: "INS-123" }, "instructor"),
    "Instructor ID and password are required",
  );
});

test("student login continues to require email", () => {
  assert.equal(
    validateLogin({ password: "secret" }, "student"),
    "Please provide a valid email address",
  );
});

test("admin login requires only admin ID and password", () => {
  assert.equal(
    validateLogin({ adminId: " adm-1 ", password: "secret" }, "admin"),
    null,
  );
  assert.equal(
    validateLogin({ password: "secret" }, "admin"),
    "Admin ID is required",
  );
  assert.equal(
    validateLogin({ adminId: "ADM-1" }, "admin"),
    "Admin ID and password are required",
  );
});
