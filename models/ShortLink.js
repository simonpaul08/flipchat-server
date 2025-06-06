import mongoose, { Schema } from "mongoose";
import { PLANS } from "../utils/constants.js";


const phoneSchema = new Schema({
  number: {
    type: String,
    required: true,
  },
  countryCode: {
    type: String,
    required: true,
  },
});

const ShortLinkSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  agents: [phoneSchema],
  message: {
    type: String,
  },
  linkType: {
    type: String,
    enum: [...Object.values(PLANS).map((value) => value)],
    default: PLANS.FREE,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  expireAt: {
    type: Date,
    index: { expires: 0 }, // Default is 0, no expiration
  },
}, {
  timestamps: true,
});

ShortLinkSchema.pre("save", function (next) {
  // set expiry 
  if (this.linkType === PLANS.FREE) {
    this.expireAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  } else {
    this.expireAt = null; // No expiration for premium
  }
  next();
});

export default mongoose.model("ShortLink", ShortLinkSchema);
