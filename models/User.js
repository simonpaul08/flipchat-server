import mongoose, { Schema } from "mongoose";

const phoneSchema = new Schema({
  number: {
    type: String,
  },
  countryCode: {
    type: String,
  },
});

const UserScehma = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: phoneSchema,
  country: {
    type: String,
  },
  accountType: {
    type: String,
  },
  industry: {
    type: String,
  },
  hasPlan: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", UserScehma);
