import express from "express";
import {
  createWhisper,
  getWhispers,
} from "../controllers/whisperController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route
router.get("/", getWhispers);

// Protected route
router.post("/", protect, createWhisper);

export default router;
