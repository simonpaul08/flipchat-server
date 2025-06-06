import mongoose, { Schema } from "mongoose";
import { PLANS } from "../utils/constants.js";

const SubscriptionSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  planType: {
    type: String,
    enum: [...Object.values(PLANS).map((value) => value)],
    required: true,
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
    required: true,
  },
  expireAt: {
    type: Date,
    index: { expires: 0 }, // Default is 0, no expiration
  },
});

SubscriptionSchema.pre("save", function (next) {
  // set expiry
  this.expireAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  next();
});

export default mongoose.model("Subscription", SubscriptionSchema);
