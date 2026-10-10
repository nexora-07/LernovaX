const Material = require("../models/Material");
const Lesson = require("../models/Lesson");

const createMaterial = async (req, res) => {
    try {
        const { title, type, url, lesson } = req.body;
        const normalizedTitle = title?.trim();

        const lessonExists = await Lesson.findById(lesson);

        if (!lessonExists) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        const existingMaterial = await Material.findOne({
            lesson,
            title: normalizedTitle,
        });

        if (existingMaterial) {
            return res.status(409).json({
                success: false,
                message: "A material with this title already exists in this lesson",
            });
        }

        const material = await Material.create({
            title: normalizedTitle,
            type,
            url,
            lesson
        });

        res.status(201).json({
            success: true,
            message: "Material created successfully",
            data: material
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A material with this title already exists in this lesson",
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//get materials belonging to a lesson
const getLessonMaterials = async (req, res) => {
    try {
        const materials = await Material.find({
            lesson: req.params.lessonId
        });

        res.status(200).json({
            success: true,
            data: materials
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//to get a material by id
const getMaterialById = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);

        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Material not found"
            });
        }

        res.status(200).json({
            success: true,
            data: material
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


//to get all materials
const getAllMaterials = async (req, res) => {
    try {
        const materials = await Material.find();
        res.status(200).json({
            success: true,
            message: "All materials retrieved successfully",
            data: materials
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//to update a material
const updateMaterial = async (req, res) => {
    try {
        const { title, type, url } = req.body;
        const material = await Material.findByIdAndUpdate(
            req.params.id,
            { title, type, url },
            { new: true }
        );

        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Material not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Material updated successfully",
            data: material
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//to delete a material by ID
const deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findByIdAndDelete(req.params.id);
        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Material not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Material deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
    }  



module.exports = {
    createMaterial,
    getLessonMaterials,
    getMaterialById,
    getAllMaterials,
    updateMaterial,
    deleteMaterial
};