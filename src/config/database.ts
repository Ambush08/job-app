import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const mongodbUri = process.env.MONGODB_URI as string;

const connectDB = async () => {
    try {
        if(!mongodbUri){
            throw new Error('Missing Mongodb env variable');
        }

        await mongoose.connect(mongodbUri);
        console.log("MongoDB connected successfully")
    } catch (error) {
        console.error("Error connecting to mongodb", error);
        
        process.exit(1);
    }
}

export default connectDB;