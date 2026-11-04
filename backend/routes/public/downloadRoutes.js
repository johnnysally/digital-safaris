import { Router } from "express";
import {
  list,
  details,
} from "../../controllers/public/downloadController.js";

const router = Router();

router.get("/", list);
router.get("/:id", details);

export default router;