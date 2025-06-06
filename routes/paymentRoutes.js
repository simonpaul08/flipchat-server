import { Router } from "express";
import { createOrder, getRazorpayKey, processPayment } from "../controllers/paymentController.js";


const router = Router()

router.route("/key")
    .get(getRazorpayKey)

router.route("/create/order")
    .post(createOrder)

router.route("/process/payment")
    .post(processPayment)

export default router;