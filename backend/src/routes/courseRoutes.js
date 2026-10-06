const express = require("express");

const courseController = require("../controllers/coursecontroller");
const authMiddleware = require("../middleware/authMiddleware");

const { protectRoute, restrictTo } = authMiddleware;

const router = express.Router();

router.post(
  "/createcourse",
  protectRoute,
  restrictTo("instructor", "admin"),
  courseController.createCourse
);

router.get(
  "/getallcourses",
  courseController.getAllCourses
);

router.get(
  "/getcoursesbyid/:id",
  courseController.getCourseById
);

router.patch(
  "/updatecourses/:id",
  protectRoute,
  restrictTo("instructor", "admin"),
  courseController.updateCourse
);

router.delete(
  "/deletecourse/:id",
  protectRoute,
  restrictTo("instructor", "admin"),
  courseController.deleteCourse
);

module.exports = router;