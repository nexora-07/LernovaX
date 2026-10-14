const Material = require("../models/Material");
const Lesson = require("../models/Lesson");
const mongoose = require("mongoose");
const path = require("path");
const DataUri = require("datauri/parser");
const { dataUri } = require("../utils/multer");
const { uploader } = require("../utils/cloudinary")

const dUri = new DataUri();

const isValidHttpUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

//create new material
const createMaterial = async (req, res) => {
    try {
        const { lesson } = req.body;
        const files = req.files?.material_file || [];
        const titles = Array.isArray(req.body.title)
            ? req.body.title
            : [req.body.title];
        const types = Array.isArray(req.body.type)
            ? req.body.type
            : [req.body.type];

        if (!files.length) {
            const title = req.body.title?.trim();
            const type = req.body.type;
            const materialLink = req.body.material_file?.trim();

            if (type === "link" && isValidHttpUrl(materialLink)) {
                const lessonExists = await Lesson.findById(lesson);
                if (!lessonExists) {
                    return res.status(404).json({
                        success: false,
                        message: "Lesson not found"
                    });
                }

                const existingMaterial = await Material.findOne({ lesson, title });
                if (existingMaterial) {
                    return res.status(409).json({
                        success: false,
                        message: "A material with this title already exists in this lesson",
                    });
                }

                const material = await Material.create({
                    title,
                    type,
                    material_file: materialLink,
                    lesson
                });

                return res.status(201).json({
                    success: true,
                    message: "Material created successfully",
                    data: [material]
                });
            }

            return res.status(400).json({
                success: false,
                message: type === "link"
                    ? "Please provide a valid HTTP or HTTPS link in material_file"
                    : "Please upload at least one file with field name material_file",
            });
        }

        if (![titles.length, types.length].every((length) =>
            length === 1 || length === files.length
        )) {
            return res.status(400).json({
                success: false,
                message: "Provide one title and type for each uploaded file",
            });
        }

        const useIndexedTitles = titles.length === 1 && files.length > 1;
        const baseTitle = titles[0]?.trim();

        const materialData = files.map((file, index) => {
            const title = useIndexedTitles
                ? `${baseTitle} - ${index + 1}`
                : (titles.length === 1 ? titles[0] : titles[index])?.trim();
            const type = types.length === 1 ? types[0] : types[index];

            return {
                title,
                type,
                file,
            };
        });

        if (materialData.some(({ title, type }) => !title || !type || type === "link")) {
            return res.status(400).json({
                success: false,
                message: "Each uploaded material requires a title and a non-link type",
            });
        }

        const lessonExists = await Lesson.findById(lesson);
        if (!lessonExists) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        const titlesToCreate = materialData.map(({ title }) => title);
        if (new Set(titlesToCreate).size !== titlesToCreate.length) {
            return res.status(409).json({
                success: false,
                message: "Material titles must be unique in a single request. Use distinct title fields, or send one title and it will be auto-numbered.",
            });
        }

        const existingMaterials = await Material.find({
            lesson,
            title: { $in: titlesToCreate },
        }).select("title");

        if (existingMaterials.length) {
            return res.status(409).json({
                success: false,
                message: `A material with this title already exists in this lesson: ${existingMaterials[0].title}`,
            });
        }

        const uploadedMaterials = await Promise.all(materialData.map(async ({ title, type, file }) => {
            const fileData = dUri.format(
                path.extname(file.originalname).toString(),
                file.buffer,
            ).content;
            const result = await uploader.upload(fileData, {
                folder: "LernovaX_LMS/Materials",
                resource_type: "auto",
            });
            return { title, type, material_file: result.secure_url, lesson };
        }));

        const materials = await Material.insertMany(uploadedMaterials);

        res.status(201).json({
            success: true,
            message: "Materials created successfully",
            data: materials
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
        const { lessonId } = req.params;

        if (!mongoose.isValidObjectId(lessonId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lesson ID",
            });
        }

        const lessonExists = await Lesson.exists({ _id: lessonId });
        if (!lessonExists) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found",
            });
        }

        const materials = await Material.find({
            lesson: lessonId
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
        const { title, type, material_file: pastedLink } = req.body;
        const materialLink = pastedLink?.trim();
        const update = { title, type };

        if (type === "link") {
            if (!isValidHttpUrl(materialLink)) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid HTTP or HTTPS link in material_file",
                });
            }
            update.material_file = materialLink;
        }

        if (type !== "link" && req.file) {
            const fileData = dataUri(req).content;
            const result = await uploader.upload(fileData, {
                folder: "LernovaX_LMS/Materials",
                resource_type: "auto",
            });
            update.material_file = result.secure_url;
        }

        const material = await Material.findByIdAndUpdate(
            req.params.id,
            update,
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