import mongoose, { Schema } from "mongoose";


const OtpModel = new Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5 // expires in 5 minutes
    }
})

export default mongoose.model("Otp", OtpModel)