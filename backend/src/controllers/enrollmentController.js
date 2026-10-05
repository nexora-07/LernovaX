const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/user");

const enrollInCourse = async (req, res, next) => {
  try {
    const studentId = req.user?.id || req.body.studentId || req.body.userId;
    const { courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        status: "failed",
        message: "studentId and courseId are required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        status: "failed",
        message: "Course not found",
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        status: "failed",
        message: "Student not found",
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
    const studentId = req.user?.id || req.query.studentId || req.params.studentId;

    if (!studentId) {
      return res.status(400).json({
        status: "failed",
        message: "studentId is required",
      });
    }

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

const cancelEnrollment = async (req, res, next) => {
  try {
    const studentId = req.user?.id || req.body.studentId || req.query.studentId;
    const { courseId } = req.params;

    if (!studentId || !courseId) {
      return res.status(400).json({
        status: "failed",
        message: "studentId and courseId are required",
      });
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
  cancelEnrollment,
};
