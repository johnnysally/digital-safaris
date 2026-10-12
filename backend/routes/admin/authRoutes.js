import { Router } from "express";
import {
  login,
  refresh,
  logout,
  me,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../../controllers/admin/authController.js";
import authenticateAdmin from "../../middleware/admin/authenticateAdmin.js";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/logout", authenticateAdmin, logout);
router.get("/me", authenticateAdmin, me);
router.patch("/me", authenticateAdmin, updateMe);
router.post("/change-password", authenticateAdmin, changePassword);

export default router;