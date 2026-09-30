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
      instructor: req.user._id, // Attached by auth middleware
    });

    res.status(201).json({
      status: "successful",
      data: {
        course,
      },
    });
  } catch (error) {}
};

module.exports = {
  createCourse,
};
