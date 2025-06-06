import ShortLink from "../models/ShortLink.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import { countryCodes, PLANS, PLANS_RATE } from "./constants.js";
import geoip from "geoip-lite";

// get all users
export const getAllUsers = () => {
  return User.find({ active: true }).exec();
};

// get user by email
export const getUserByEmail = (email) => {
  return User.findOne({ email, active: true }).exec();
};

// get user by Id
export const getUserById = (id) => {
  return User.findOne({ _id: id, active: true }).exec();
};

// get subscription by user id
export const getSubscriptionByUserId = (id) => {
  return Subscription.findOne({ user: id }).exec();
};

// get link by id
export const getLinkById = (id) => {
  return ShortLink.findOne({ _id: id }).exec();
};

// get premium links
export const getPremiumLinks = (id) => {
  return ShortLink.find({
    owner: id,
    linkType: { $ne: PLANS.FREE },
  }).sort({ createdAt: -1 });
};

// check Upgrade Or Downgrade
export const handleCheckUpgradeOrDowngrade = (prevPlan, newPlan) => {
  console.log(PLANS_RATE[prevPlan], PLANS_RATE[newPlan]);
  return PLANS_RATE[prevPlan] < PLANS_RATE[newPlan] ? true : false;
};

// check OS
export const extractOs = (userAgent) => {
  let os;
  if (userAgent.includes("Windows NT")) {
    os = "Windows";
  } else if (
    userAgent.includes("Macintosh")
  ) {
    os = "macOS";
  } else if (userAgent.includes("iPhone")) {
    os = "iOS"
  } else if (userAgent.includes("Linux") && userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else {
    os = "Unknown"
  }

  return os;
};

// check country using ip
export const extractCountryFromIp = (ip) => {
  const geo = geoip.lookup(ip);
  console.log("geo -- ", geo)
  let country = "Unknown";

  if (geo && geo.country) {
    // Get the country name using the country code
    country = geo.country ?? "Unknown";
  }
  const countryName = countryCodes.find(item => item.code === country)?.name ?? "Unknown"
  return countryName;
};

// prepare data for analytics 
export const prepareDataForAnalytics = (operatingSystem, country, referer) => {
  let url = referer;
  if (referer !== "direct") {
    const link = new URL(referer);
    url = link.hostname;
  }
  return {
    source: url,
    country: country,
    operatingSystem: operatingSystem,
    createdAt: new Date()
  }
}