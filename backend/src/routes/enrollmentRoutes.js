const express = require("express");

const {
  enrollInCourse,
  getMyEnrollments,
  cancelEnrollment,
} = require("../controllers/enrollmentController");

const router = express.Router();

router.post("/", enrollInCourse);
router.get("/", getMyEnrollments);
router.patch("/:courseId/cancel", cancelEnrollment);

module.exports = router;
