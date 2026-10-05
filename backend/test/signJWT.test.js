const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const signJwt = require("../src/utils/signJWT");

test("JWT signer rejects weak secrets and signs with HS256", () => {
    const originalSecret = process.env.JWT_SECRET;

    try {
        process.env.JWT_SECRET = "too-short";
        assert.throws(() => signJwt("user-id"), /at least 32 bytes/);

        process.env.JWT_SECRET = "test-secret-with-at-least-32-bytes-long";
        const token = signJwt("user-id");
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        assert.equal(decoded.id, "user-id");
    } finally {
        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }
    }
});