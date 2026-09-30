const mongoose = require('mongoose');
const mongo_password = process.env.MONGODB_PASSWORD;
const mongo_url = process.env.MONGODB_URL.replace("<password>", mongo_password);
const connectDB = async()=>{
    mongoose.connect(mongo_url).then(()=>{
        console.log(`Database connection successful`);
        
    }).catch((error)=>{
        console.log(`An error occured while connecting to database:`, error);
        
    })
}

module.exports = connectDB;