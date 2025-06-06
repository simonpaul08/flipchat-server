import asyncHandler from "express-async-handler";
import ShortLink from "../models/ShortLink.js";
import { PLANS } from "../utils/constants.js";
import {
  extractCountryFromIp,
  extractOs,
  getSubscriptionByUserId,
  getUserById,
  prepareDataForAnalytics,
} from "../utils/utils.js";
import requestIp from "request-ip";
import Analytics from "../models/Analytics.js";
import moment from "moment";

// redirect link - GET
export const redirectLink = asyncHandler(async (req, res) => {
  const { link } = req.params;

  const userAgent = req.get("User-Agent");

  console.log(userAgent)

  const operatingSystem = extractOs(userAgent) || "Unknown";

  // Get the user's IP address
  const ip = requestIp.getClientIp(req);
  const referer = req.headers["referer"] || "direct";
  console.log(referer)

  const country = extractCountryFromIp(ip);

  const analyticsData = prepareDataForAnalytics(
    operatingSystem,
    country,
    referer
  );


  if (!link) {
    // redirect to app.flipchat.link
    return res.redirect("app.flipchat.link");
  }

  // find link
  const shortLink = await ShortLink.findOne({ username: link });

  if (!shortLink) {
    return res.status(404).json({ message: "link does not exists" });
  }

  const todayStart = moment().startOf('day').toDate();
  const todayEnd = moment().endOf('day').toDate();

  // check if it's a free link
  if (shortLink.linkType === PLANS.FREE) {
    const agent = shortLink.agents[0];
    const url = `https://wa.me/${agent.countryCode}${agent.number}?text=${shortLink.message}`;

    // find analytics
    const existingAnalytics = await Analytics.findOne({
      shortLink: shortLink?._id,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    })

    if (existingAnalytics) {
      // exists
      await Analytics.findOneAndUpdate(
        {
          shortLink: shortLink?._id,
          createdAt: { $gte: todayStart, $lte: todayEnd },
        },
        {
          $inc: { clicks: 1 },
          $push: { data: analyticsData },
        },
      );
    } else {
      // create new 
      await Analytics.create(
        {
          clicks: 1,
          data: [analyticsData],
          linkType: PLANS.FREE,
          createdAt: new Date(),
          shortLink: shortLink?._id,
        }
      );
    }

    return res.redirect(url);
  }

  // if it is a premium link
  const currentLinkPlan = shortLink.linkType;

  // check if user still has the same active plan
  const user = await getUserById(shortLink.owner);

  if (!user) {
    return res.status(404).json({ message: "link is currently disabled" });
  }

  const subscription = await getSubscriptionByUserId(user._id);

  if (!subscription) {
    return res.status(404).json({ message: "link is currently disabled" });
  }

  if (subscription.planType !== PLANS[currentLinkPlan]) {
    return res.status(404).json({ message: "link is currently disabled" });
  }

  // plan matches and user exists with an active plan

  // get a random agent
  const randomDigit = Math.floor(Math.random() * shortLink.agents.length);
  const randomAgent = shortLink.agents[randomDigit];

  // redirect to the url
  const url = `https://wa.me/${randomAgent.countryCode}${randomAgent.number}?text=${shortLink.message}`;

  // find analytics
  const existingAnalytics = await Analytics.findOne({
    shortLink: shortLink?._id,
    createdAt: { $gte: todayStart, $lte: todayEnd }
  })


  if (existingAnalytics) {
    // update analytics
    await Analytics.findOneAndUpdate(
      {
        shortLink: shortLink?._id,
        createdAt: { $gte: todayStart, $lte: todayEnd }
      },
      {
        $inc: { clicks: 1 },
        $push: { data: analyticsData },
      },
    );
  } else {
    // create new 
    await Analytics.create({
      linkType: PLANS[shortLink.linkType],
      clicks: 1,
      data: [analyticsData],
      createdAt: new Date(),
      shortLink: shortLink?._id,
    })
  }

  res.redirect(url);
});

// redirect to client - GET
export const redirectToClient = asyncHandler(async (req, res) => {
  return res.redirect("http://app.flipchat.link");
});
