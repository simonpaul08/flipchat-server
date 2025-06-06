import asyncHandler from "express-async-handler";
import Razorpay from "razorpay";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import dotenv from "dotenv";
import { handleSubscribe } from "./subscripionController.js";

dotenv.config()

const RAZORPAY_KEY = process.env.RAZORPAY_KEY;
const RAZORPAY_API_SECRET = process.env.RAZORPAY_SECRET;

const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY,
  key_secret: RAZORPAY_API_SECRET,
});

// Get Razor Pay Api Key
export const getRazorpayKey = asyncHandler(async (req, res) => {
  return res.status(200).json({ message: "razorpay key retrieved", key: RAZORPAY_KEY })
})

// Create Order - POST
export const createOrder = asyncHandler(async (req, res) => {
  const { amount, userId, planType } = req.body;

  if (!amount || !userId || !planType) {
    return res.status(404).json({ message: "all fields are required" });
  }

  const totalPaisa = Number(amount) * 100; // converted to paisa
  const receipt = uuidv4()

  try {
    // create order
    const options = {
      amount: totalPaisa,
      currency: "INR",
      receipt: receipt,
      payment_capture: 1,
      notes: {
        userId: userId,
        planType: planType,
      }
    };
    const order = await razorpayInstance.orders.create(options);
    res.status(200).json({ message: "order created successfully", order });
  } catch (e) {
    console.error("Error during checkout:", e);
    res.status(500).json({ message: "Error during checkout" });
  }
});

// Process Payment - POST
export const processPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {

    // create subscription, transaction and other necessary entries
    const paymentData = await razorpayInstance.payments.fetch(razorpay_payment_id)
    const { userId, planType } = paymentData?.notes;

    // handle subscribe 
    const subscribe = await handleSubscribe(userId, planType)

    if(!subscribe.status){
      return res.status(500).json({ message: subscribe.message })
    }

    res.status(200).json({ message: subscribe.message })

  } else {
    res.status(500).json({
      message: "Error processing payment"
    });
  }
});
