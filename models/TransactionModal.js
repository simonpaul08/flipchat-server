import mongoose, { Schema } from "mongoose";
import { PLANS, STATUS } from "../utils/constants.js";

const TransactionModal = new Schema(
  {
    planType: {
      type: String,
      enum: [...Object.values(PLANS).map((value) => value)],
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [...Object.values(STATUS).map(value => value)],
      default: STATUS.FAILURE
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Transaction", TransactionModal);
