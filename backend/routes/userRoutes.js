import express from "express";
import {
  registerUser,
  loginUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// All routes below require authentication
router.use(protect);

router.post("/block/:userId", blockUser);
router.post("/unblock/:userId", unblockUser);
router.get("/blocked", getBlockedUsers);
router.get("/:id", getUserProfile);
router.put("/me", updateUserProfile);
export default router;
