import { Router } from "express";
import { listLandingReviews } from "../../controllers/public/reviewsController.js";

const router = Router();

router.get("/", listLandingReviews);

export default router;
