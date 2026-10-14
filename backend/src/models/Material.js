const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: ["pdf", "video", "audio", "image", "document", "link"],
            required: true
        },

        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
            required: true
        },
        
        material_file: {
            type: String,
            required: [true, "Please upload a material file"]
        }
    },
    {
        timestamps: true
    }
);

materialSchema.index({ lesson: 1, title: 1 }, { unique: true });
module.exports = mongoose.model("Material", materialSchema);
