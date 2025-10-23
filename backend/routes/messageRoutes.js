import express from "express";
import { sendMessage, getMessages } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// Send a message
router.post("/", sendMessage);

// Get messages with a friend
router.get("/:friendId", getMessages);

export default router;
