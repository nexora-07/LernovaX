const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const User = require("../src/models/user");
const Enrollment = require("../src/models/Enrollment");

const app = require("../app");

test("course progress endpoints require a student bearer token", async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve, reject) => {
    server.closeAllConnections();
    server.close((error) => error ? reject(error) : resolve());
  }));

  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/enrollments/507f1f77bcf86cd799439011/progress`;
  const getResponse = await fetch(baseUrl);
  const updateResponse = await fetch(baseUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId: "lesson-1", completed: true, totalLessons: 1 }),
  });

  assert.equal(getResponse.status, 401);
  assert.equal((await getResponse.json()).message, "Please sign in to access this resource");
  assert.equal(updateResponse.status, 401);
  assert.equal((await updateResponse.json()).message, "Please sign in to access this resource");
});

test("students can update progress idempotently and read the calculated percentage", async (context) => {
  const secret = "test-secret-with-at-least-32-bytes-long";
  const originalSecret = process.env.JWT_SECRET;
  const originalFindById = User.findById;
  const originalFindOne = Enrollment.findOne;
  const studentId = "507f1f77bcf86cd799439012";
  const courseId = "507f1f77bcf86cd799439011";
  const enrollment = {
    course: courseId,
    progress: {
      completedLessons: [],
      totalLessons: 0,
      startedAt: null,
      completedAt: null,
      lastLessonId: null,
      updatedAt: new Date(),
    },
    updatedAt: new Date(),
    save: async () => {},
  };

  process.env.JWT_SECRET = secret;
  User.findById = async () => ({ _id: studentId, role: "student" });
  Enrollment.findOne = async () => enrollment;

  const server = app.listen(0);
  context.after(() => new Promise((resolve, reject) => {
    process.env.JWT_SECRET = originalSecret;
    User.findById = originalFindById;
    Enrollment.findOne = originalFindOne;
    server.closeAllConnections();
    server.close((error) => error ? reject(error) : resolve());
  }));

  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/enrollments/${courseId}/progress`;
  const authorization = `Bearer ${jwt.sign({ id: studentId }, secret)}`;
  const updateProgress = (progressUpdate = {
    lessonId: "lesson-1",
    completed: true,
    totalLessons: 2,
  }) => fetch(baseUrl, {
    method: "PATCH",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(progressUpdate),
  });

  assert.equal((await updateProgress()).status, 200);
  assert.equal((await updateProgress()).status, 200);
  assert.equal((await updateProgress({
    lessonId: "lesson-2",
    completed: true,
    totalLessons: 3,
  })).status, 409);

  const completedResponse = await updateProgress({
    lessonId: "lesson-2",
    completed: true,
    totalLessons: 2,
  });
  const completedBody = await completedResponse.json();
  assert.equal(completedResponse.status, 200);
  assert.equal(completedBody.data.progress.isComplete, true);
  assert.equal(typeof completedBody.data.progress.completedAt, "string");

  assert.equal((await updateProgress({
    lessonId: "lesson-2",
    completed: false,
    totalLessons: 2,
  })).status, 200);

  const response = await fetch(baseUrl, { headers: { Authorization: authorization } });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.data.progress.completedLessons, ["lesson-1"]);
  assert.equal(body.data.progress.totalLessons, 2);
  assert.equal(body.data.progress.progressPercentage, 50);
  assert.equal(body.data.progress.isComplete, false);
  assert.equal(body.data.progress.completedAt, null);
  assert.equal(typeof body.data.progress.startedAt, "string");
  assert.equal(body.data.progress.lastLessonId, "lesson-2");
});