import mongoose, { Schema } from "mongoose";
import { PLANS } from "../utils/constants.js";

const AnalyticsData = new Schema({
  source: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  operatingSystem: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AnalyticsModal = new Schema({
  data: [AnalyticsData],
  clicks: {
    type: Number,
    required: true,
    default: 0
  },
  shortLink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShortLink",
    required: true,
  },
  linkType: {
    type: String,
    enum: [...Object.values(PLANS).map((value) => value)],
    default: PLANS.FREE,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expireAt: {
    type: Date,
    index: { expires: 0 }, // Default is 0, no expiration
  },
});

AnalyticsModal.pre("save", function (next) {
    // set expiry
    if(this.linkType === PLANS.FREE) {
        this.expireAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    }
    next()
});

export default mongoose.model("Analytics", AnalyticsModal);
