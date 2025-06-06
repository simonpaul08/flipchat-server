import { Router } from "express";
import { fetchTransactions } from "../controllers/transactionController.js";


const router = Router()

router.route("/records/:id")
    .get(fetchTransactions)



export default router;