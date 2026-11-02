import { Router } from "express";
import { overview } from "../../controllers/accom/dashboardController.js";
import authenticateAccommodation from "../../middleware/partner/authenticateAccommodation.js";

const router = Router();

router.get("/overview", authenticateAccommodation, overview);

export default router;