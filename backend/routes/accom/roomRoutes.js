import { Router } from "express";
import multer from "multer";
import {
  list,
  details,
  create,
  update,
  remove,
  uploadImage,
  removeImage,
} from "../../controllers/accom/roomController.js";
import authenticateAccommodation from "../../middleware/partner/authenticateAccommodation.js";

const router = Router();

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", authenticateAccommodation, list);
router.get("/:id", authenticateAccommodation, details);
router.post("/", authenticateAccommodation, create);
router.patch("/:id", authenticateAccommodation, update);
router.delete("/:id", authenticateAccommodation, remove);

router.post(
  "/:id/images",
  authenticateAccommodation,
  uploader.single("file"),
  uploadImage
);
router.delete("/:id/images", authenticateAccommodation, removeImage);

export default router;