const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const AppError = require("../utils/AppError");

const formatProgress = (enrollment) => {
  const progress = enrollment.progress || {};
  const completedLessons = Array.isArray(progress.completedLessons)
    ? [...new Set(progress.completedLessons
      .filter((lessonId) => typeof lessonId === "string")
      .map((lessonId) => lessonId.trim())
      .filter(Boolean))]
    : [];
  const totalLessons = Number.isInteger(progress.totalLessons) && progress.totalLessons > 0
    ? progress.totalLessons
    : 0;
  const isComplete = totalLessons > 0 && completedLessons.length >= totalLessons;

  return {
    courseId: enrollment.course,
    completedLessons,
    totalLessons,
    progressPercentage: totalLessons > 0
      ? Math.min(100, Math.round((completedLessons.length / totalLessons) * 100))
      : 0,
    isComplete,
    startedAt: progress.startedAt || null,
    completedAt: isComplete ? progress.completedAt || null : null,
    lastLessonId: progress.lastLessonId || null,
    updatedAt: progress.updatedAt || enrollment.updatedAt,
  };
};

const requireStudentId = (req) => {
  if (!req.user) {
    throw new AppError("Please sign in to access this resource", 401);
  }
  if (req.user.role !== "student") {
    throw new AppError("You do not have permission to perform this action", 403);
  }
  if (!req.user._id) {
    throw new AppError("Invalid authenticated user", 401);
  }

  return req.user._id;
};

const findEnrollment = async (courseId, studentId) => {
  if (!mongoose.isObjectIdOrHexString(courseId)) {
    throw new AppError("Invalid courseId", 400);
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: { $ne: "cancelled" },
  });

  if (!enrollment) {
    throw new AppError("Enrollment not found", 404);
  }

  return enrollment;
};

const getCourseProgress = async (req, res, next) => {
  try {
    const studentId = requireStudentId(req);
    const enrollment = await findEnrollment(req.params?.courseId, studentId);

    return res.status(200).json({
      status: "success",
      data: { progress: formatProgress(enrollment) },
    });
  } catch (error) {
    return next(error);
  }
};

const updateCourseProgress = async (req, res, next) => {
  try {
    const studentId = requireStudentId(req);
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      throw new AppError("Request body must be a JSON object", 400);
    }

    const { lessonId, completed, totalLessons } = req.body;

    if (typeof lessonId !== "string" || !lessonId.trim() || lessonId.trim().length > 200) {
      throw new AppError("lessonId must be a non-empty string of at most 200 characters", 400);
    }
    if (typeof completed !== "boolean") {
      throw new AppError("completed must be a boolean", 400);
    }
    if (!Number.isInteger(totalLessons) || totalLessons < 1) {
      throw new AppError("totalLessons must be a positive integer", 400);
    }

    const enrollment = await findEnrollment(req.params?.courseId, studentId);
    const normalizedLessonId = lessonId.trim();
    const progress = enrollment.progress || (enrollment.progress = {});
    const currentTotalLessons = Number.isInteger(progress.totalLessons)
      ? progress.totalLessons
      : 0;

    if (currentTotalLessons > 0 && currentTotalLessons !== totalLessons) {
      throw new AppError("totalLessons cannot change after progress has started", 409);
    }

    const completedLessons = Array.isArray(progress.completedLessons)
      ? [...new Set(progress.completedLessons
        .filter((completedLessonId) => typeof completedLessonId === "string")
        .map((completedLessonId) => completedLessonId.trim())
        .filter(Boolean))]
      : [];
    const lessonIndex = completedLessons.indexOf(normalizedLessonId);

    if (completed && lessonIndex === -1) {
      completedLessons.push(normalizedLessonId);
    } else if (!completed && lessonIndex !== -1) {
      completedLessons.splice(lessonIndex, 1);
    }

    if (completedLessons.length > totalLessons) {
      throw new AppError("Completed lessons cannot exceed totalLessons", 400);
    }

    const updatedAt = new Date();
    progress.completedLessons = completedLessons;
    progress.totalLessons = totalLessons;
    progress.startedAt = progress.startedAt || updatedAt;
    progress.completedAt = completedLessons.length === totalLessons
      ? progress.completedAt || updatedAt
      : null;
    progress.lastLessonId = normalizedLessonId;
    progress.updatedAt = updatedAt;
    await enrollment.save();

    return res.status(200).json({
      status: "success",
      data: { progress: formatProgress(enrollment) },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getCourseProgress, updateCourseProgress };