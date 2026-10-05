const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { protectRoute, restrictTo } = require("../src/middleware/authMiddleware");

const invokeMiddleware = async (middleware, req) => {
    let nextError;
    let nextCalled = false;

    await middleware(req, {}, (error) => {
        nextError = error;
        nextCalled = true;
    });

    return { nextError, nextCalled };
};

test("protected route rejects a missing bearer token", async () => {
    const { nextError } = await invokeMiddleware(protectRoute, { headers: {} });
    assert.equal(nextError.statusCode, 401);
});

test("protected route rejects an invalid bearer token", async () => {
    process.env.JWT_SECRET = "test-secret-with-at-least-32-bytes-long";
    const { nextError } = await invokeMiddleware(protectRoute, {
        headers: { authorization: "Bearer invalid-token" },
    });
    assert.equal(nextError.statusCode, 401);
});

test("protected route rejects JWT algorithms outside HS256", async () => {
    process.env.JWT_SECRET = "test-secret-with-at-least-32-bytes-long";
    const token = jwt.sign(
        { id: "507f1f77bcf86cd799439011" },
        process.env.JWT_SECRET,
        { algorithm: "HS384" },
    );
    const { nextError } = await invokeMiddleware(protectRoute, {
        headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(nextError.statusCode, 401);
});

test("protected route rejects weak server JWT configuration", async () => {
    process.env.JWT_SECRET = "too-short";
    const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
    const { nextError } = await invokeMiddleware(protectRoute, {
        headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(nextError.statusCode, 500);
});

test("protected route rejects a signed token when the account is missing", async () => {
    process.env.JWT_SECRET = "test-secret-with-at-least-32-bytes-long";
    const originalFindById = require("../src/models/user").findById;
    require("../src/models/user").findById = async () => null;

    try {
        const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
        const { nextError } = await invokeMiddleware(protectRoute, {
            headers: { authorization: `Bearer ${token}` },
        });
        assert.equal(nextError.statusCode, 401);
    } finally {
        require("../src/models/user").findById = originalFindById;
    }
});

test("role restrictions distinguish unauthenticated and forbidden requests", () => {
    const unauthenticated = [];
    restrictTo("admin")({}, {}, (error) => unauthenticated.push(error));
    assert.equal(unauthenticated[0].statusCode, 401);

    const forbidden = [];
    restrictTo("admin")({ user: { role: "student" } }, {}, (error) => forbidden.push(error));
    assert.equal(forbidden[0].statusCode, 403);

    let allowed = false;
    restrictTo("admin")({ user: { role: "admin" } }, {}, () => { allowed = true; });
    assert.equal(allowed, true);
});