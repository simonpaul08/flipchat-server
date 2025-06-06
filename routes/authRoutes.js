import { Router } from "express";
import { forgetPassword, login, loginGoogle, refreshToken, register, registerGoogle, verifyOTPForget, verifyOTPRegister } from "../controllers/authController.js";

const router = Router()

router.route("/register")
    .post(register)
    
router.route("/verifyOTP")
    .post(verifyOTPRegister)

router.route("/login")
    .post(login)

router.route("/refresh")
    .get(refreshToken)

router.route("/google/register")
    .post(registerGoogle)

router.route("/google/login")
    .post(loginGoogle)

router.route("/forget")
    .post(forgetPassword)

router.route("/forget/verify")
    .post(verifyOTPForget)


export default router;