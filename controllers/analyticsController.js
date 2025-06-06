import asyncHandler from "express-async-handler";
import moment from "moment";
import Analytics from "../models/Analytics.js";

// POST - get analytics by date
export const getAnalyticsByDate = asyncHandler(async (req, res) => {
  const { id, date } = req.body;

  if (!id || !date) {
    return res.status(400).json({ message: "id or date is missing" });
  }

  const givenDate = moment(date);

  const startDay = givenDate.startOf("day").toDate();
  const endDay = givenDate.endOf("day").toDate();

  const analytics = await Analytics.findOne({
    shortLink: id,
    createdAt: { $gte: new Date(startDay), $lte: new Date(endDay) },
  });

  if (!analytics) {
    return res
      .status(200)
      .json({ message: "fetched link analytics", data: null });
  } else {
    return res
      .status(200)
      .json({ message: "fetched link analytics", data: analytics });
  }
});

// POST - get analytics by month
export const getAnalyticsByMonth = asyncHandler(async (req, res) => {
  const { id, month } = req.body;

  if (!id || !month) {
    return res.status(400).json({ message: "id or date is missing" });
  }

  const givenMonth = moment(month, "MMMM YYYY");
  console.log(givenMonth)

  const startOfMonth = givenMonth.startOf("month").toDate();

  const endOfMonth = givenMonth.endOf("month").toDate();

  const analytics = await Analytics.find({
    shortLink: id,
    createdAt: { $gte: new Date(startOfMonth), $lte: new Date(endOfMonth) },
  });

  if (!analytics) {
    return res
      .status(200)
      .json({ message: "fetched link analytics", data: null });
  } else {
    return res
      .status(200)
      .json({ message: "fetched link analytics", data: analytics });
  }
});
