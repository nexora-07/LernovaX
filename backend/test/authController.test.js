const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const User = require("../src/models/user");
const authController = require("../src/controllers/authcontroller");

const invoke = async (handler, body) => {
  let error;
  let statusCode;
  let responseBody;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      responseBody = value;
      return this;
    },
  };

  await handler({ body }, response, (nextError) => {
    error = nextError;
  });

  return { error, statusCode, responseBody };
};

test("staff signup codes authorize registration and staff IDs are required to sign in", async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalInstructorCode = process.env.INSTRUCTOR_SIGNUP_CODE;
  const originalAdminCode = process.env.ADMIN_SIGNUP_CODE;

  process.env.JWT_SECRET = "test-secret-with-at-least-32-bytes-long";
  process.env.INSTRUCTOR_SIGNUP_CODE = "test-instructor-code-with-at-least-32-bytes";
  process.env.ADMIN_SIGNUP_CODE = "test-admin-code-with-at-least-32-bytes-long";

  try {
    for (const accountType of [
      {
        role: "instructor",
        idField: "instructorId",
        idValue: "INS-1001",
        codeEnvironmentVariable: "INSTRUCTOR_SIGNUP_CODE",
        signup: authController.signupInstructor,
        login: authController.loginInstructor,
      },
      {
        role: "admin",
        idField: "adminId",
        idValue: "ADM-1001",
        codeEnvironmentVariable: "ADMIN_SIGNUP_CODE",
        signup: authController.signupAdmin,
        login: authController.loginAdmin,
      },
    ]) {
      let createdUser;
      let query;
      User.findOne = async (filter) => {
        query = filter;
        return null;
      };
      User.create = async (data) => {
        createdUser = data;
        return { ...data, _id: "user-id", createdAt: new Date(0) };
      };

      const signupBody = {
        firstname: "Ada",
        lastname: "Lovelace",
        email: `${accountType.role}@example.com`,
        password: "correct-horse",
        confirmPassword: "correct-horse",
        [accountType.idField]: accountType.idValue.toLowerCase(),
        signupCode: process.env[accountType.codeEnvironmentVariable],
      };
      const signupResult = await invoke(accountType.signup, signupBody);

      assert.equal(signupResult.error, undefined);
      assert.equal(signupResult.statusCode, 201);
      assert.deepEqual(query, { email: signupBody.email });
      assert.equal(createdUser.role, accountType.role);
      assert.equal(createdUser[accountType.idField], accountType.idValue);
      assert.equal(createdUser.confirmPassword, undefined);
      assert.equal(createdUser.signupCode, undefined);
      assert.equal(signupResult.responseBody.data.user[accountType.idField], accountType.idValue);

      const hashedPassword = await bcrypt.hash("correct-horse", 4);
      const savedUser = {
        ...createdUser,
        _id: "user-id",
        password: hashedPassword,
        createdAt: new Date(0),
      };
      User.findOne = (filter) => {
        query = filter;
        return { select: async () => savedUser };
      };

      const loginBody = {
        email: signupBody.email,
        password: "correct-horse",
        [accountType.idField]: accountType.idValue.toLowerCase(),
      };
      const loginResult = await invoke(accountType.login, loginBody);

      assert.equal(loginResult.error, undefined);
      assert.equal(loginResult.statusCode, 200);
      assert.deepEqual(query, {
        email: signupBody.email,
        role: accountType.role,
        [accountType.idField]: accountType.idValue,
      });
    }
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
    if (originalInstructorCode === undefined) delete process.env.INSTRUCTOR_SIGNUP_CODE;
    else process.env.INSTRUCTOR_SIGNUP_CODE = originalInstructorCode;
    if (originalAdminCode === undefined) delete process.env.ADMIN_SIGNUP_CODE;
    else process.env.ADMIN_SIGNUP_CODE = originalAdminCode;
  }
});

test("staff signup rejects an invalid configured code before accessing the database", async () => {
  const originalFindOne = User.findOne;
  const originalAdminCode = process.env.ADMIN_SIGNUP_CODE;
  let databaseWasQueried = false;
  process.env.ADMIN_SIGNUP_CODE = "test-admin-code-with-at-least-32-bytes-long";
  User.findOne = async () => {
    databaseWasQueried = true;
    return null;
  };

  try {
    const result = await invoke(authController.signupAdmin, {
      firstname: "Ada",
      lastname: "Lovelace",
      email: "ada@example.com",
      password: "correct-horse",
      confirmPassword: "correct-horse",
      adminId: "ADM-1001",
      signupCode: "wrong-code",
    });

    assert.equal(result.error.statusCode, 403);
    assert.equal(result.error.message, "Invalid role signup code");
    assert.equal(databaseWasQueried, false);
  } finally {
    User.findOne = originalFindOne;
    if (originalAdminCode === undefined) delete process.env.ADMIN_SIGNUP_CODE;
    else process.env.ADMIN_SIGNUP_CODE = originalAdminCode;
  }
});
