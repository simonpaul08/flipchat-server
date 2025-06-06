import { Router } from "express";
import { redirectLink, redirectToClient } from "../controllers/redirectController.js";


const router = Router()

router.route("/")
    .get(redirectToClient)

router.route("/:link")
    .get(redirectLink)


export default router;