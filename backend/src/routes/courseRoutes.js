const express = require("express");
const courseController = require("../controllers/coursecontroller");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/createcourse")
  .post(
    authMiddleware.protectRoute,
    authMiddleware.restrictTo("instructor", "admin"),
    courseController.createCourse
  );

router
  .route("/getAllCourses")
  .get(courseController.getAllCourses);

module.exports = router;