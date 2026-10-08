import { Router } from "express";
import { subscribe } from "../../controllers/public/newsletterController.js";

const router = Router();

router.post("/", subscribe);

export default router;
