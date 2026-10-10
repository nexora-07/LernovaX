const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true
        },

        order: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

lessonSchema.index({ course: 1, title: 1 }, { unique: true });

module.exports = mongoose.model("Lesson", lessonSchema);
