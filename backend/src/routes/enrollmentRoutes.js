const express = require("express");

const {
  enrollInCourse,
  getMyEnrollments,
  updateEnrollmentStatus,
  cancelEnrollment,
} = require("../controllers/enrollmentController");

const router = express.Router();

router.post("/", enrollInCourse);
router.get("/", getMyEnrollments);
router.patch("/:courseId", updateEnrollmentStatus);
router.patch("/:courseId/cancel", cancelEnrollment);

module.exports = router;
