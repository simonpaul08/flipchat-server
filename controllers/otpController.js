import asyncHandler from "express-async-handler";
import OtpModel from "../models/OtpModel.js";
import { getUserByEmail } from "../utils/utils.js";
import { sendForgetPasswordMail, sendVerificationEmail } from "../utils/sendEmail.js";
import User from "../models/User.js";

// verify otp
export const verifyOTP = asyncHandler(async (req, res) => {
  const { otp } = req.params;

  if (!otp) {
    return res.status(400).json({ message: "otp is missing" });
  }

  // check if otp exists
  const isOTP = await OtpModel.findOne({ otp }).lean();
  if (!isOTP) {
    return res.status(404).json({ message: "otp verification failed" });
  }

  res.status(200).json({ message: "otp verified" });
});

// resend otp
export const resendForgetOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "email is missing" });
  }

  // check user
  const isUser = await getUserByEmail(email);
  if (!isUser) {
    return res
      .status(404)
      .json({ message: "user with this email does not exists" });
  }

  // send forget password mail
  const sendMail = await sendForgetPasswordMail(email);
  console.log(sendMail);

  if (!sendMail) {
    return res.status(500).json({ message: "something went wrong" });
  }

  res.status(200).json({ message: "otp sent successfully" });
});


// register resent otp
export const registerResend = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "email is missing" });
  }

  // check user
  const isUser = await User.findOne({ email });
  if (!isUser) {
    return res
      .status(404)
      .json({ message: "user with this email does not exists" });
  }

  // send forget password mail
  const sendMail = await sendVerificationEmail(email);
  console.log(sendMail);

  if (!sendMail) {
    return res.status(500).json({ message: "something went wrong" });
  }

  res.status(200).json({ message: "otp sent successfully" });
})
