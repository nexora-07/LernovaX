const jwt = require("jsonwebtoken");

const signJwt = (id) => {
    if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
        throw new Error("JWT_SECRET must be at least 32 bytes");
    }

    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES || "7d",
        algorithm: "HS256",
    });
};

module.exports = signJwt;
