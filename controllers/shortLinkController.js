import asyncHandler from "express-async-handler";
import { v4 as uuidv4 } from "uuid";
import ShortLink from "../models/ShortLink.js";
import { AGENT_PER_PLAN, LINKS_PER_PLAN, PLANS } from "../utils/constants.js";
import {
  getLinkById,
  getSubscriptionByUserId,
  getUserById,
} from "../utils/utils.js";
import Subscription from "../models/Subscription.js";

// unknownLink - POST
export const unknownLink = asyncHandler(async (req, res) => {
  const { agents, message } = req.body;

  if (!agents?.length) {
    return res.status(404).json({ message: "all fields are required!" });
  }

  // check agents as per plan
  if (agents && agents?.length !== AGENT_PER_PLAN.FREE) {
    return res
      .status(400)
      .json({ message: "free plan can only have one agent" });
  }

  // create random uid
  const uuid = uuidv4();
  const match = uuid.match(/^(.*?)-/);

  const shortened = match[1] ?? uuid;

  // create unknown link
  const shortLink = await ShortLink.create({
    agents,
    message,
    username: shortened,
  });

  if (!shortLink) {
    return res.status(500).json({ message: "unable to create short link" });
  }

  res
    .status(200)
    .json({ message: "short link created successfully", shortLink: shortLink });
});

// find brand - POST
export const findBrandLink = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(404).json({ message: "all fields are required!" });
  }

  // find brand
  const isAvailable = await ShortLink.findOne({ username: name }).lean();

  if (isAvailable) {
    return res.status(409).json({ message: "brand already exists" });
  }

  res.status(200).json({ message: "brand doesn't exists" });
});

// fetch link by id
export const findLinkById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "id is missing" });
  }

  const link = await getLinkById(id);

  if (!link) {
    return res.status(404).json({ message: "link does not exists" });
  }

  return res.status(200).json({ message: "link fetched successfully", link })
})

/* ------- FREE LINKS ------- */

// FREE link - POST
export const createFreeLink = asyncHandler(async (req, res) => {
  const { agents, message, userId } = req.body;

  if (!agents?.length || !userId) {
    return res.status(404).json({ message: "all fields are required!" });
  }

  // check agents as per plan
  if (agents && agents?.length !== AGENT_PER_PLAN.FREE) {
    return res
      .status(400)
      .json({ message: "free plan can only have one agent" });
  }

  // create random uid
  const uuid = uuidv4();
  const match = uuid.match(/^(.*?)-/);

  const shortened = match[1] ?? uuid;

  const shortLink = await ShortLink.create({
    agents,
    message,
    username: shortened,
    owner: userId,
  });

  if (!shortLink) {
    return res.status(500).json({ message: "unable to create short link" });
  }

  res
    .status(200)
    .json({ message: "short link created successfully", shortLink: shortLink });
});

// FREE link - PATCH
export const updateFreeLink = asyncHandler(async (req, res) => {
  const { id, message, agents } = req.body;

  if (!id || !message || !agents.length) {
    return res.status(400).json({ message: "all fields are required" });
  }

  // check if link exists
  const link = await ShortLink.findOneAndUpdate(
    {
      _id: id,
    },
    {
      agents: agents,
      message: message,
    },
    {
      returnOriginal: false
    }
  );
  if (!link) {
    return res.status(404).json({ message: "link doesn't exists" });
  }

  res.status(201).json({ message: "link updated successfully", shortLink: link });
});

// FREE link - DELETE
export const deleteFreeLink = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "id is missing" });
  }

  // check if link exists
  const link = await ShortLink.findOneAndDelete({
    _id: id,
  });

  if (!link) {
    return res.status(404).json({ message: "link doesn't exists" });
  }

  res.status(200).json({ message: "link deleted successfully" });
});

// Fetch All Links - GET
export const fetchAllLinks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "id is missing" })
  }

  // check links 
  const links = await ShortLink.find({ owner: id }).sort({ createdAt: -1 });

  if (!links.length) {
    return res.status(404).json({ message: "no links found" })
  }

  res.status(200).json({ message: "fetched links successfully", links: links })

})


/* ------- PREMIUM LINKS ------- */

// get premium link count - GET
export const getPremiumLinkCount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "id is missing" })
  }

  const subscription = await Subscription.findOne({ user: id });
  if (!subscription) {
    return res.status(404).json({ message: "no plan found" })
  }

  // check links 
  const links = await ShortLink.find({ owner: id, linkType: subscription.planType });

  if (!links.length) {
    return res.status(404).json({ message: "no links found" })
  }

  res.status(200).json({ message: "fetched links successfully", count: links.length })
})

// PREMIUM link - POST
export const createPremiumLink = asyncHandler(async (req, res) => {
  const { agents, message, userId, username } = req.body;

  if (!agents?.length || !userId || !username) {
    return res.status(404).json({ message: "all fields are required!" });
  }

  // check user
  const user = await getUserById(userId);
  if (!user) {
    return res.status(404).json({ message: "user doesn't exists" });
  }

  // check if user has an active subscription
  const isSubscription = await getSubscriptionByUserId(userId);
  if (!isSubscription) {
    return res.status(404).json({ message: "no active plan found" });
  }

  // check if the user has defined number of premium links as per the plan
  const numberOfLinks = await ShortLink.find({
    owner: userId,
    linkType: isSubscription.planType,
  });
  console.log("number of links", numberOfLinks)
  if (numberOfLinks.length >= LINKS_PER_PLAN[isSubscription.planType]) {
    // if number of links are already satisfied as per plan
    return res.status(500).json({ message: "no premium link left" });
  }

  // check agents as per the plan
  if (agents && agents?.length > AGENT_PER_PLAN[isSubscription.planType]) {
    // if the number of agents are more than the allowed agents
    return res.status(500).json({
      message: `your active plan can only have upto ${AGENT_PER_PLAN[isSubscription.planType]
        } agents`,
    });
  }

  // check if username already exists
  const loweredCase = username?.toLowerCase() ?? username;
  const isDuplicate = await ShortLink.findOne({ username: loweredCase });
  if (isDuplicate) {
    return res
      .status(409)
      .json({ message: "link with the same username already exists" });
  }

  // create link
  const link = await ShortLink.create({
    agents,
    username: loweredCase,
    owner: userId,
    linkType: isSubscription.planType,
    message,
  });

  if (!link) {
    return res.status(500).json({ message: "error creating link" });
  }

  res.status(201).json({ message: "link created successfully", shortLink: link });
});

// PREMIUM link - PATCH
export const updatePremiumLink = asyncHandler(async (req, res) => {
  const { agents, message, username, id } = req.body;

  if (!agents?.length || !message || !id || !username) {
    return res.status(404).json({ message: "all fields are required!" });
  }

  // check if link exists
  const link = await getLinkById(id);
  if (!link) {
    return res.status(404).json({ message: "link doesn't exists" });
  }

  // check user
  const user = await getUserById(link.owner);
  if (!user) {
    return res.status(404).json({ message: "user doesn't exists" });
  }

  // check if user has an active subscription
  const isSubscription = await getSubscriptionByUserId(user?._id);
  if (!isSubscription) {
    return res.status(404).json({ message: "no active plan found" });
  }

  // check if username already exists
  const isDuplicate = await ShortLink.findOne({ username });
  if (isDuplicate && !isDuplicate?._id?.equals(id)) {
    return res
      .status(409)
      .json({ message: "link with the same username already exists" });
  }

  const update = await ShortLink.findOneAndUpdate(
    {
      _id: id
    }, {
    agents,
    message,
    username,
  }, {
    returnOriginal: false
  }
  )

  if (!update) {
    return res.status(500).json({ message: "error updating link" })
  }

  res.status(201).json({ message: "link updated successfully", shortLink: update })
});

// PREMIUM link - PATCH
export const deletePremiumLink = asyncHandler(async (req, res) => {
  // unclear, keeping it simple

  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "id is missing" });
  }

  // check if link exists
  const link = await ShortLink.findOneAndDelete({
    _id: id,
  });

  if (!link) {
    return res.status(404).json({ message: "link doesn't exists" });
  }

  res.status(200).json({ message: "link deleted successfully" });

})
