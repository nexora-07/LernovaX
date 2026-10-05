const jwt = require('jsonwebtoken');

const signJwt = (id)=>{
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES
    })
}

module.exports = signJwt;