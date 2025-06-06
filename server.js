import express from "express";
import dotenv from "dotenv";
import { connectToDB } from "./config/connectToDB.js";
import mongoose from "mongoose";
import AuthRoutes from "./routes/authRoutes.js";
import LinkRoutes from "./routes/shortLinkRoutes.js";
import OTPRoutes from "./routes/otpRoutes.js";
import UserRoutes from "./routes/userRoutes.js";
import SubscriptionRoutes from "./routes/subscriptionRoutes.js";
import PaymentRoutes from "./routes/paymentRoutes.js";
import TransactionRoutes from "./routes/transactionRoutes.js";
import RedirectRoutes from "./routes/redirectRoutes.js";
import AnalyticsRoutes from "./routes/analyticsRoutes.js";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { useGoogleStrategy } from "./utils/passport.js";

dotenv.config();
connectToDB();
useGoogleStrategy();

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;

const app = express();

// middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PATCH"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Referer",
    ],
  })
);
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.set('trust proxy', true);

// health check
app.get("/health", (req, res) => {
  res.status(200).json({ message: "server health check: Running" });
});

// routes
// main route - Redirect link
app.use("/", RedirectRoutes);

app.use("/api/auth", AuthRoutes);
app.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);
app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/api/auth/google/callback/success",
    failureRedirect: "/api/auth/google/callback/failure",
  })
);
app.use("/api/link", LinkRoutes);
app.use("/api/otp", OTPRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/subscription", SubscriptionRoutes);
app.use("/api/payment", PaymentRoutes);
app.use("/api/transaction", TransactionRoutes);
app.use("/api/analytics", AnalyticsRoutes)

app.listen(PORT, () => {
  mongoose.connection.once("open", () => {
    console.log("Connected To DB");
    console.log(`server running on port ${PORT}`);
  });
});
