const { config, uploader } = require("cloudinary").v2;

const cloudinaryConfig = (req, res, next) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret =
        process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET_KEY;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error(
            "Cloudinary credentials missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env",
        );
    }

    config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });

    if (typeof next === "function") next();
};

cloudinaryConfig();

module.exports = { cloudinaryConfig, uploader };