import express from "express";
import {
  registerUser,
  loginUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getUserProfile,
  updateUserProfile,
  searchUserByUsername,
  changePassword,
  deleteMe,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// All routes below require authentication
router.use(protect);

router.get("/search/:username", searchUserByUsername);
router.post("/block/:userId", blockUser);
router.post("/unblock/:userId", unblockUser);
router.get("/blocked", getBlockedUsers);
router.get("/:id", getUserProfile);
router.put("/me", updateUserProfile);
router.put("/me/password", changePassword);
router.delete("/me", deleteMe);
export default router;
