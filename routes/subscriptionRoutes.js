import { Router } from "express";
import { createSubscription } from "../controllers/subscripionController.js";


const router = Router()

router.route("/subscribe")
    .post(createSubscription)



export default router;