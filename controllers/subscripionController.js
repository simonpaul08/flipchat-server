import asyncHandler from "express-async-handler";
import Subscription from "../models/Subscription.js";
import { getPremiumLinks, getUserById, handleCheckUpgradeOrDowngrade } from "../utils/utils.js";
import TransactionModal from "../models/TransactionModal.js";
import { AGENT_PER_PLAN, LINKS_PER_PLAN, PLANS_RATE, STATUS } from "../utils/constants.js";
import ShortLink from "../models/ShortLink.js";


// Handle Subscribe 
export const handleSubscribe = async (userId, planType) => {

    if (!userId || !planType) {
        return {
            status: false,
            message: "some fields are missing"
        }
    }

    // check user
    const user = await getUserById(userId);
    if (!user) {
        return {
            status: false,
            message: "user not found"
        }
    }

    // check if user has a subscription 
    const currentSubscription = await Subscription.findOneAndDelete({
        user: userId
    });

    // create transaction 
    const transaction = await TransactionModal.create({ user: userId, planType: planType, amount: PLANS_RATE[planType], status: STATUS.SUCCESS })

    if (!transaction) {
        return {
            status: false,
            message: "error during transaction"
        }
    }

    // create subscription
    const subscribe = await Subscription.create({ user: userId, planType, transactionId: transaction?._id })

    if (!subscribe) {
        // delete transaction 
        await TransactionModal.findOneAndUpdate({
            _id: transaction?._id
        }, {
            status: STATUS.FAILURE
        })
        return {
            status: false,
            message: "error subscribing to the plan"
        }
    }

    // if there was no prev subscription
    if (!currentSubscription) {
        return {
            status: true,
            message: "User Subscribed Successfully",
            transactionId: transaction?._id
        }
    }

    // if prev plan and new plan is same
    if (currentSubscription.planType === subscribe.planType) {
        return {
            status: true,
            message: "User Subscribed Successfully",
            transactionId: transaction?._id
        }
    }


    // filter, delete and update links as per the plan 

    // downgrade or upgrade
    const isUpgrade = handleCheckUpgradeOrDowngrade(currentSubscription.planType, subscribe.planType)

    if (isUpgrade) {
        const upgrade = await handleUpgradeLinks(userId, subscribe.planType)
        if (!upgrade) {
            console.log("error while upgrading links")
        }
    } else {
        const downgrade = await handleDowngradeLinks(userId, subscribe.planType)
        if (!downgrade) {
            console.log("error while downgrading links")
        }
    }

    return {
        status: true,
        message: "User Subscribed Successfully",
        transactionId: transaction?._id
    }

}

// handle downgrade links 
export const handleDowngradeLinks = async (userId, planType) => {

    console.log("---- Downgrading ----")

    const allLinks = await getPremiumLinks(userId)
    const sliced = allLinks.slice(LINKS_PER_PLAN[planType])

    const slicedIds = sliced.map(link => link._id);

    // filter remaining links 
    const remainingLinks = allLinks.filter(link => !slicedIds.includes(link._id));

    const remainingLinksIds = remainingLinks.map(link => link._id);


    // delete extra links
    if (allLinks.length > LINKS_PER_PLAN[planType]) {
        console.log("inside if condition")

        try {
            // Delete the sliced links by their IDs
            await ShortLink.deleteMany({ _id: { $in: slicedIds } });

        } catch (e) {
            console.log(e)
            return false;
        }
    }

    // update the remaining links with the new planType
    await ShortLink.updateMany(
        { _id: { $in: remainingLinksIds } },
        { $set: { linkType: planType } }
    );

    // update agents as per the new plan 
    for (let i = 0; i < remainingLinksIds.length; i++) {
        const link = await ShortLink.findOne({ _id: remainingLinksIds[i] })
        if (link.agents.length > AGENT_PER_PLAN[planType]) {
            const slicedAgents = link.agents.slice(0, AGENT_PER_PLAN[planType])
            link.agents = slicedAgents
            await link.save()
        }
    }

    return true

}


// handle upgrade links
export const handleUpgradeLinks = async (userId, planType) => {

    console.log("---- Upgrading ----")

    const allLinks = await getPremiumLinks(userId)

    console.log("links - ", allLinks)

    try {
        const allLinksIds = allLinks.map(link => link._id);

        // update the links with the new planType
        await ShortLink.updateMany(
            { _id: { $in: allLinksIds } },
            { $set: { linkType: planType } }
        );
    } catch (e) {
        console.log(e)
        return false;
    }


    return true;
}


// Create Subscription - POST
export const createSubscription = asyncHandler(async (req, res) => {
    const { userId, planType, transactionId } = req.body;

    if (!userId || !planType || !transactionId) {
        return res.status(404).json({ message: "all fields are required!" });
    }

    // check user
    const user = await getUserById(userId);
    if (!user) {
        return res.status(404).json({ message: "user doesn't exists" });
    }

    // check if user has a subscription 
    await Subscription.findOneAndDelete({
        user: userId
    });

    // create subscription
    const subscribe = await Subscription.create({ user: userId, planType, transactionId })

    if (!subscribe) {
        return res.status(500).json({ message: "error subscribing to the plan" })
    }

    res.status(201).json({ message: "subscribed successfully" })

})

