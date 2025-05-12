
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        
        console.log('[DB Connection] Attempting connection...'); 
        console.log('[DB Connection] URI:', process.env.MONGODB_URI); 
        

        await mongoose.connect(process.env.MONGODB_URI, { /* options */ });
        console.log(`MongoDB Connected: ${mongoose.connection.host}`); 

    } catch (err) {
        console.error(`MongoDB Connection Error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;