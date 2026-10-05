const test = require("node:test");
const assert = require("node:assert/strict");

process.env.FRONTEND_URL = "https://lernovax.vercel.app/";

const app = require("../app");

test("auth routes validate signup input and normalize the frontend CORS origin", async (context) => {
    const server = app.listen(0);
    context.after(() => new Promise((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => error ? reject(error) : resolve());
    }));

    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/auth/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Origin: "https://lernovax.vercel.app",
        },
        body: JSON.stringify({ email: "not-an-email", password: "short" }),
    });

    assert.equal(response.status, 400);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://lernovax.vercel.app");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal((await response.json()).message, "First name and last name are required");
});

test("current-user endpoint requires a bearer token", async (context) => {
    const server = app.listen(0);
    context.after(() => new Promise((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => error ? reject(error) : resolve());
    }));

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/auth/me`);

    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, "Please sign in to access this resource");
});

test("JSON request bodies above the configured limit are rejected", async (context) => {
    const server = app.listen(0);
    context.after(() => new Promise((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => error ? reject(error) : resolve());
    }));

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "x".repeat(17 * 1024) }),
    });

    assert.equal(response.status, 413);
});

test("signup and login requests are throttled by client IP", async (context) => {
    const server = app.listen(0);
    context.after(() => new Promise((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => error ? reject(error) : resolve());
    }));

    const statuses = [];
    for (let attempt = 0; attempt < 12; attempt += 1) {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "bad", password: "bad" }),
        });
        statuses.push(response.status);
    }

    assert.equal(statuses.at(-1), 429);
});