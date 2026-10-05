const express = require("express");
const courseController = require("../controllers/coursecontroller");
const authMiddleware = require("../middleware/authMiddleware");
const { protectRoute, restrictTo } = authMiddleware;

const router = express.Router();

router
  .route("/createcourse")
  .post(
    authMiddleware.protectRoute,
    authMiddleware.restrictTo("instructor", "admin"),
    courseController.createCourse,
  );

router.route("/getAllCourses").get(courseController.getAllCourses);

router
  .route("/:id")
  .get(courseController.getCourseById)
  .patch(
    protectRoute,
    restrictTo("instructor", "admin"),
    courseController.updateCourse,
  );

module.exports = router;
