import { Router } from "express";
import {
  list,
  bulkUpdate,
} from "../../controllers/accom/roomUnitController.js";
import authenticateAccommodation from "../../middleware/partner/authenticateAccommodation.js";

const router = Router();

router.get("/", authenticateAccommodation, list);
router.post("/bulk-update", authenticateAccommodation, bulkUpdate);

export default router;