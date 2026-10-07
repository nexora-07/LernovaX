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
            enum: ["pdf", "video", "document", "link"],
            required: true
        },

        url: {
            type: String,
            required: true
        },

        lesson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Material", materialSchema);
