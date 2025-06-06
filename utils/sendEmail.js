import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { generate } from "otp-generator";
import OtpModel from "../models/OtpModel.js";
dotenv.config();

const USER_MAIL = process.env.USER_MAIL;
const USER_PASS = process.env.USER_PASS;

const mailTransporter = await nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: USER_MAIL,
    pass: USER_PASS,
  },
});

// send verification mail
export const sendVerificationEmail = async (email) => {
  // check otp
  const otp = await generateOtp(email);
  if (!otp) {
    return false;
  }

  // draft mail details
  let mailDetails = {
    from: USER_MAIL,
    to: email,
    subject: "Flipchat Registration - Verification Mail",
    text: `Please verify your account using the OTP: ${otp}.`,
  };

  try {
    await sendMail(mailDetails);
    return true;
  } catch (e) {
    console.log("error sending mail", e);
    return false;
  }
};

// send forget password mail
export const sendForgetPasswordMail = async (email) => {
  // check otp
  const otp = await generateOtp(email);
  if (!otp) {
    return false;
  }

  // draft mail details
  let mailDetails = {
    from: USER_MAIL,
    to: email,
    subject: "Flipchat - Forget Password Mail",
    text: `Use this OTP to create new password for you account: ${otp}.`,
  };

  try {
    await sendMail(mailDetails);
    return true;
  } catch (e) {
    console.log("error sending mail", e);
    return false;
  }
};

// generate and save otp
export const generateOtp = async (email) => {
  // generate otp
  const otp = await generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });

  // check if otp already exists
  const isOtp = await OtpModel.findOne({ email }).lean();
  if (isOtp) {
    await OtpModel.findOneAndDelete({ email });
  }

  const saveOtp = await OtpModel.create({ email, otp });
  if (!saveOtp) {
    console.log("error saving otp");
    return false;
  }

  return otp;
};

// send email
export const sendMail = async (config) => {
  await mailTransporter.sendMail(config);
};
