import { Router } from "express";
import { registerResend, resendForgetOtp, verifyOTP } from "../controllers/otpController.js";

const router = Router()

router.route("/verify/:otp")
    .get(verifyOTP)

router.route("/forget/resend")
    .post(resendForgetOtp)

router.route("/register/resend")
    .post(registerResend)


export default router;