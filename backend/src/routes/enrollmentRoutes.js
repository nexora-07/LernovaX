const express = require("express");

const {
  enrollInCourse,
  getMyEnrollments,
  updateEnrollmentStatus,
  cancelEnrollment,
} = require("../controllers/enrollmentController");
const { protectRoute, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protectRoute, restrictTo("student"));

router.post("/", enrollInCourse);
router.get("/", getMyEnrollments);
router.patch("/:courseId", updateEnrollmentStatus);
router.patch("/:courseId/cancel", cancelEnrollment);

module.exports = router;
