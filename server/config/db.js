// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('[DB Connection] Attempting connection...'); 
        await mongoose.connect(process.env.MONGODB_URI, { 
        });
        
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (err) {
        console.error(`MongoDB Connection Error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;