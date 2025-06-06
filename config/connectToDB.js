import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config()

const URI = process.env.MONGO_URI;

export const connectToDB = async () => {
    try {
        await mongoose.connect(URI)
    }catch(e) {
        console.log(e)
    }
}