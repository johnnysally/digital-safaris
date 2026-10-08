import { Router } from "express";
import { listPublished } from "../../controllers/public/reviewController.js";

const router = Router();

router.get("/", listPublished);

export default router;
