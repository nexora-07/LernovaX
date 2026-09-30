const mongoose = require("mongoose");

const connectDB = async () => {
    let mongoUrl = process.env.MONGODB_URL;

    if (!mongoUrl) {
        console.warn("MONGODB_URL is not configured; starting without a database connection.");
        return false;
    }

    if (mongoUrl.includes("<password>")) {
        if (!process.env.MONGODB_PASSWORD) {
            console.warn("MONGODB_PASSWORD is required when MONGODB_URL contains <password>.");
            return false;
        }

        mongoUrl = mongoUrl.replace(
            "<password>",
            encodeURIComponent(process.env.MONGODB_PASSWORD),
        );
    }

    try {
        await mongoose.connect(mongoUrl);
        console.log("Database connection successful");
        return true;
    } catch (error) {
        console.error("Unable to connect to MongoDB:", error.message);
        return false;
    }
};

module.exports = connectDB;