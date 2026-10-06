const Course = require("../models/Course");
const AppError = require("../utils/AppError");

const createCourse = async (req, res, next) => {
  try {
    const { title, description, category, price, thumbnail } = req.body;

    const existingCourse = await Course.findOne({
      title: title.trim(),
      instructor: req.user._id,
    });

    if (existingCourse) {
      return next(
        new AppError("You already have a course with this title", 409),
      );
    }

    const course = await Course.create({
      title: title.trim(),
      description,
      category,
      price,
      thumbnail,
      instructor: req.user._id,
    });

    res.status(201).json({
      status: "successful",
      data: {
        course,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find();

    res.status(200).json({
      status: "successful",
      data: {
        courses,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    res.status(200).json({
      status: "successful",
      data: {
        course,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    res.status(200).json({
      status: "successful",
      data: {
        course,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
