const Course = require("../models/Course");

const createCourse = async (req, res, next) => {
  try {
    const { title, description, category, price, thumbnail } = req.body;

    const course = await Course.create({
      title,
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

module.exports = {
  createCourse,
  getAllCourses,
};
