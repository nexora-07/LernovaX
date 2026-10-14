const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const AppError = require("../utils/AppError");

const getStudentId = (req) => {
  if (!req.user?._id) {
    throw new AppError("Please sign in to access this resource", 401);
  }
  if (req.user.role !== "student") {
    throw new AppError("You do not have permission to perform this action", 403);
  }

  return req.user._id;
};

const validateCourseId = (courseId) => {
  if (!courseId) {
    throw new AppError("courseId is required", 400);
  }

  if (!mongoose.isObjectIdOrHexString(courseId)) {
    throw new AppError("courseId must be a valid MongoDB ObjectId", 400);
  }
};

const enrollInCourse = async (req, res, next) => {
  try {
    const studentId = getStudentId(req);
    const { courseId } = req.body || {};
    validateCourseId(courseId);

    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment) {
      throw new AppError("Student is already enrolled in this course", 409);
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
      status: "success",
      data: {
        enrollment: populatedEnrollment,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("Student is already enrolled in this course", 409));
    }
    return next(error);
  }
};

const getMyEnrollments = async (req, res, next) => {
  try {
    const studentId = getStudentId(req);

    const enrollments = await Enrollment.find({ student: studentId })
      .populate("course", "title description category price isPublished")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
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
    const studentId = getStudentId(req);
    const { courseId } = req.params;
    const { status } = req.body || {};
    validateCourseId(courseId);

    const validStatuses = ["active", "completed", "cancelled"];

    if (!validStatuses.includes(status)) {
      throw new AppError("status must be one of: active, completed, cancelled", 400);
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      { status },
      { new: true },
    ).populate("course", "title description category");

    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }

    return res.status(200).json({
      status: "success",
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
    const studentId = getStudentId(req);
    const { courseId } = req.params;
    validateCourseId(courseId);

    const enrollment = await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      { status: "cancelled" },
      { new: true },
    ).populate("course", "title description category");

    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }

    return res.status(200).json({
      status: "success",
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
