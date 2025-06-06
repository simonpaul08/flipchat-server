import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import { PLANS } from "../utils/constants.js";
import { getUserById } from "../utils/utils.js";
import bcrypt from "bcrypt";

// Get User - GET
export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "id is missing" });
  }

  // check user
  const user = await User.findOne({ _id: id }).exec();
  if (!user) {
    return res.status(404).json({ message: "user doesn't exists" });
  }

  // check subscription
  const subscription = await Subscription.findOne({ user: id });

  // if subscription does not exists
  if (!subscription) {
    let sendUser = {
      id: user?._id,
      name: user?.name,
      email: user?.email,
      planType: PLANS.FREE,
    };

    return res
      .status(200)
      .json({ message: "user fetched successfully", user: sendUser });
  }

  // if subscription exists
  let sendUser = {
    id: user?._id,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    country: user?.country,
    accountType: user?.accountType,
    industry: user?.industry,
    planType: subscription.planType,
  };

  res
    .status(200)
    .json({ message: "user fetched successfully", user: sendUser });
});

// Update User - PATCH
export const updateUserDetails = asyncHandler(async (req, res) => {
  const { id, name, phone, country, accountType, industry } = req.body;

  if (!id || !name || !phone || !country || !accountType || !industry) {
    return res.status(400).json({ message: "all fields are required" });
  }

  // check user
  const isUser = await getUserById(id);
  if (!isUser) {
    return res.status(404).json({ message: "user doesn't exists" });
  }

  // check user and update
  const user = await User.findOneAndUpdate(
    {
      _id: id,
    },
    {
      name,
      phone,
      country,
      accountType,
      industry,
    }
  );

  if (!user) {
    return res.status(500).json({ message: "error updating the user" });
  }

  res.status(200).json({ message: "user updated successfully" });
});

// Update Password - PATCH
export const updateUserPassword = asyncHandler(async (req, res) => {
  const { id, password, newPassword } = req.body;

  if (!id || !password || !newPassword) {
    return res.status(400).json({ message: "all fields are required" });
  }

  // check user
  const isUser = await getUserById(id);
  if (!isUser) {
    return res.status(404).json({ message: "user doesn't exists" });
  }

  // check password 
  const isPasswordMatch = await bcrypt.compare(password, isUser.password)
  console.log(isPasswordMatch)

  if(!isPasswordMatch) {
    return res.status(400).json({ message: "current password is invalid" })
  }

  // hash the password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // update user
  const user = await User.findOneAndUpdate(
    {
      _id: id,
    },
    {
      password: hashedPassword,
    }
  );

  if (!user) {
    return res.status(500).json({ message: "error updating user" })
  }

  res.status(200).json({ message: "password updated successfully" })

});
