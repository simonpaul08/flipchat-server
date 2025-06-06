import { Router } from "express";
import {
  createFreeLink,
  createPremiumLink,
  deleteFreeLink,
  deletePremiumLink,
  fetchAllLinks,
  findBrandLink,
  findLinkById,
  getPremiumLinkCount,
  unknownLink,
  updateFreeLink,
  updatePremiumLink,
} from "../controllers/shortLinkController.js";

const router = Router();

router.route("/unknown").post(unknownLink);

router.route("/brand/check").post(findBrandLink);

router.route("/shortLink/:id").get(findLinkById)

router.route("/:id").get(fetchAllLinks)


/* ------- FREE LINKS ------- */

router.route("/create/free").post(createFreeLink);

router.route("/update/free").patch(updateFreeLink);

router.route("/delete/free/:id").delete(deleteFreeLink);


/* ------- PREMIUM LINKS ------- */

router.route("/create/premium").post(createPremiumLink);

router.route("/update/premium").patch(updatePremiumLink);

router.route("/delete/premium/:id").delete(deletePremiumLink);

router.route("/premium/count/:id").get(getPremiumLinkCount)

export default router;
