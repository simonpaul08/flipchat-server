import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import OtpModel from "../models/OtpModel.js";
import { getUserByEmail } from "../utils/utils.js";
import {
  sendForgetPasswordMail,
  sendVerificationEmail,
} from "../utils/sendEmail.js";
import { GoogleClient } from "../utils/google.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

dotenv.config();
const ACCESS_TOKEN = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN_SECRET;

// Register - POST
export const register = asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(404).json({ message: "all fields are required!" });
  }
  // check duplicate
  const duplicate = await User.findOne({ email }).lean();
  if (duplicate?.active) {
    return res
      .status(409)
      .json({ message: "user with this email already exists" });
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  if (duplicate && !duplicate?.active) {
    // user exists but not active
    const updateUser = await User.findOneAndUpdate(
      {
        email: duplicate.email,
      },
      {
        name: name,
        password: hashedPassword,
      }
    );
    console.log("user exists but not active", updateUser);
    if (!updateUser) {
      return res.status(500).json({ message: "error creating user" });
    }
  } else {
    // create new user
    const user = await User.create({ name, email, password: hashedPassword });

    if (!user) {
      return res.status(500).json({ message: "error creating user" });
    }
  }

  const sendMail = await sendVerificationEmail(email);

  if (!sendMail) {
    return res.status(500).json({ message: "something went wrong" });
  }

  res.status(201).json({
    message: "otp sent successfully",
  });
});

// VerifyOTP - POST
export const verifyOTPRegister = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(404).json({ message: "all fields are required!" });
  }

  const isOTP = await OtpModel.findOne({ email }).lean();
  console.log(isOTP);
  if (!isOTP) {
    return res.status(404).json({ message: "otp is not generated" });
  }

  // compare otp
  if (otp !== isOTP.otp) {
    return res.status(404).json({ message: "wrong otp" });
  }

  // update user
  const user = await User.findOneAndUpdate(
    {
      email: email,
    },
    {
      active: true,
    }
  );
  if (!user) {
    return res.status(500).json({ message: "registration failed" });
  }

  const accessToken = jwt.sign(
    {
      userInfo: {
        id: user._id,
        name: user?.name,
        email: user?.email,
      },
    },
    ACCESS_TOKEN,
    { expiresIn: "15s" }
  );

  let sendUser = {
    id: user._id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    country: user.country,
    accountType: user.accountType,
    industry: user.industry
  };
  res
    .status(200)
    .json({ message: "otp verified successfully", user: sendUser, accessToken: accessToken });
});

// Login - POST
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(404).json({ message: "all fields are required!" });
  }

  // fetch user
  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(400).json({ message: "user not found" });
  }

  // match password
  const compare = await bcrypt.compare(password, user.password);

  if (!compare) {
    return res.status(400).json({ message: "wrong credentials" });
  }

  const accessToken = jwt.sign(
    {
      userInfo: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    },
    ACCESS_TOKEN,
    { expiresIn: "15s" }
  );

  const refreshToken = jwt.sign(
    {
      email: user.email,
    },
    REFRESH_TOKEN,
    { expiresIn: "2m" }
  );

  //   // set cookie
  //   res.cookie("jwt", refreshToken, {
  //     httpOnly: true,
  //     secure: true,
  //     sameSite: "none",
  //     maxAge: 2 * 60 * 1000,
  //   });

  let sendUser = {
    id: user._id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    country: user.country,
    accountType: user.accountType,
    industry: user.industry
  };

  res.status(200).json({
    message: "logged in successfully",
    user: sendUser,
    accessToken: accessToken
  });
});

// Refresh - GET
export const refreshToken = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    REFRESH_TOKEN,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        email: decoded?.email,
      }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          userInfo: {
            name: decoded?.name,
            email: decoded?.email,
            hasPlan: decoded?.hasPlan,
            active: decoded?.active,
          },
        },
        ACCESS_TOKEN,
        { expiresIn: "15s" }
      );

      res.json({ accessToken: accessToken });
    })
  );
});

// Google - Register
export const registerGoogle = asyncHandler(async (req, res) => {
  const code = req.body;

  if (!code) {
    return res.status(400).json({ message: "auth code is missing" });
  }

  // get google access token
  const googleRes = await GoogleClient.getToken(code);
  GoogleClient.setCredentials(googleRes.tokens);

  // get user details using google access token
  const userRes = await axios.get(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
  );

  // get email and name from user details
  const { email, name } = userRes?.data;
  if (!email || !name) {
    return res.status(500).json({ message: "something went wrong" });
  }

  // check user
  const user = await User.findOne({ email }).lean();
  if (user) {
    return res.status(409).json({ message: "user already registered" });
  }

  // register user
  const uuid = uuidv4(); // random password
  const newUser = await User.create({
    email,
    name,
    active: true,
    password: uuid,
  });
  if (!newUser) {
    return res.status(500).json({ message: "unable to register user" });
  }

  const accessToken = jwt.sign(
    {
      userInfo: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      },
    },
    ACCESS_TOKEN,
    { expiresIn: "15s" }
  );

  const refreshToken = jwt.sign(
    {
      email: newUser.email,
    },
    REFRESH_TOKEN,
    { expiresIn: "2m" }
  );

  //   // set cookie
  //   res.cookie("jwt", refreshToken, {
  //     httpOnly: true,
  //     secure: true,
  //     sameSite: "none",
  //     maxAge: 2 * 60 * 1000,
  //   });

  let sendUser = {
    id: newUser._id,
    email: newUser.email,
    name: newUser.name,
    phone: newUser.phone,
    country: newUser.country,
    accountType: newUser.accountType,
    industry: newUser.industry
  };

  res.status(200).json({
    message: "registered successfully",
    accessToken: accessToken,
    user: sendUser,
  });
});

// Google - Login
export const loginGoogle = asyncHandler(async (req, res) => {
  const code = req.body;

  if (!code) {
    return res.status(400).json({ message: "auth code is missing" });
  }

  // get google access token
  const googleRes = await GoogleClient.getToken(code);
  GoogleClient.setCredentials(googleRes.tokens);

  // get user details using google access token
  const userRes = await axios.get(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
  );

  // get email and name from user details
  const { email, name } = userRes?.data;
  if (!email || !name) {
    return res.status(500).json({ message: "something went wrong" });
  }

  // check user
  const user = await User.findOne({ email }).lean();
  if (!user) {
    return res.status(404).json({ message: "user not registered" });
  }

  const accessToken = jwt.sign(
    {
      userInfo: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    },
    ACCESS_TOKEN,
    { expiresIn: "15s" }
  );

  const refreshToken = jwt.sign(
    {
      email: user.email,
    },
    REFRESH_TOKEN,
    { expiresIn: "2m" }
  );

  //   // set cookie
  //   res.cookie("jwt", refreshToken, {
  //     httpOnly: true,
  //     secure: true,
  //     sameSite: "none",
  //     maxAge: 2 * 60 * 1000,
  //   });

  let sendUser = {
    id: user._id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    country: user.country,
    accountType: user.accountType,
    industry: user.industry
  };

  res.status(200).json({
    message: "logged in successfully",
    accessToken: accessToken,
    user: sendUser,
  });
});

// Forget Password
export const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "email is required" });
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

// verify OTP & Change password
export const verifyOTPForget = asyncHandler(async (req, res) => {
  const { otp, password } = req.body;
  if (!otp || !password) {
    return res.status(400).json({ message: "all fields are required" });
  }

  // check if otp exists
  const isOTP = await OtpModel.findOne({ otp }).lean();
  if (!isOTP) {
    return res.status(404).json({ message: "otp verification failed" });
  }

  // find user and update
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate(
    {
      email: isOTP.email,
    },
    {
      password: hashedPassword,
    }
  );

  if (!user) {
    return res.status(500).json({ message: "error updating password" })
  }

  res.status(201).json({ message: "password updated successfully" })
});
