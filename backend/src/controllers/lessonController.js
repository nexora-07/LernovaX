const Lesson = require("../models/Lesson");


const createLesson = async (req, res) => {
    try {
        const { title, description, course, order } = req.body;
        const normalizedTitle = title?.trim();

        const existingLesson = await Lesson.findOne({
            title: normalizedTitle,
            course,
        });

        if (existingLesson) {
            return res.status(409).json({
                success: false,
                message: "A lesson with this title already exists in this course",
            });
        }

        const lesson = await Lesson.create({
            title: normalizedTitle,
            description,
            course,
            order
        });

        res.status(201).json({
            success: true,
            message: "Lesson created successfully",
            data: lesson
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A lesson with this title already exists in this course",
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//get all lessons
const getLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find();

        res.status(200).json({
            success: true,
            data: lessons
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// get a lesson by id
const getLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        res.status(200).json({
            success: true,
            data: lesson
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Lesson updated successfully",
            data: lesson
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findByIdAndDelete(req.params.id);

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Lesson deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createLesson,
    getLessons,
    getLesson,
    updateLesson,
    deleteLesson
};