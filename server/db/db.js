const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/chat_auth_db';
        const conn = await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
