import asyncHandler from "express-async-handler";
import { getUserById } from "../utils/utils.js";
import TransactionModal from "../models/TransactionModal.js";


// fetch records 
export const fetchTransactions = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(404).json({ message: "userId is missing" });
    }

    // check user 
    const user = await getUserById(id);
    if (!user) {
        return res.status(404).json({ message: "user doesn't exists" });
    }

    // fetch transactions
    const transactions = await TransactionModal.find({ user: id }).sort({ createdAt: -1 });

    return res.status(200).json({ message: "fetch transaction successfully", transactions: transactions, totalCount: transactions.length })

})