const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");

const validateCourseId = (courseId, res) => {
  if (!courseId) {
    res.status(400).json({
      status: "failed",
      message: "courseId is required",
    });
    return false;
  }

  if (!mongoose.isObjectIdOrHexString(courseId)) {
    res.status(400).json({
      status: "failed",
      message: "courseId must be a valid MongoDB ObjectId",
    });
    return false;
  }

  return true;
};

const enrollInCourse = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.body;

    if (!validateCourseId(courseId, res)) {
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: "failed",
        message: "Course not found",
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        status: "failed",
        message: "Student is already enrolled in this course",
      });
    }

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      status: "active",
    });

    const populatedEnrollment = await enrollment.populate([
      { path: "student", select: "firstname lastname email role" },
      { path: "course", select: "title description category price isPublished" },
    ]);

    return res.status(201).json({
      status: "successful",
      data: {
        enrollment: populatedEnrollment,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getMyEnrollments = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const enrollments = await Enrollment.find({ student: studentId })
      .populate("course", "title description category price isPublished")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "successful",
      results: enrollments.length,
      data: {
        enrollments,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateEnrollmentStatus = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;
    const { status } = req.body || {};

    if (!validateCourseId(courseId, res)) {
      return;
    }

    const validStatuses = ["active", "completed", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: "failed",
        message: "status must be one of: active, completed, cancelled",
      });
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      { status },
      { new: true },
    ).populate("course", "title description category");

    if (!enrollment) {
      return res.status(404).json({
        status: "failed",
        message: "Enrollment not found",
      });
    }

    return res.status(200).json({
      status: "successful",
      data: {
        enrollment,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const cancelEnrollment = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    if (!validateCourseId(courseId, res)) {
      return;
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      { status: "cancelled" },
      { new: true },
    ).populate("course", "title description category");

    if (!enrollment) {
      return res.status(404).json({
        status: "failed",
        message: "Enrollment not found",
      });
    }

    return res.status(200).json({
      status: "successful",
      data: {
        enrollment,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  enrollInCourse,
  getMyEnrollments,
  updateEnrollmentStatus,
  cancelEnrollment,
};
