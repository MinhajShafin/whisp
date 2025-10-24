import express from "express";
import {
  createWhisper,
  getWhispers,
  getTimeline,
  likeWhisper,
  dislikeWhisper,
  addComment,
  replyToComment,
  editComment,
  deleteComment,
  editReply,
  deleteReply,
} from "../controllers/whisperController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route
router.get("/", getWhispers);

// Protected route
router.post("/", protect, createWhisper);
router.get("/timeline", protect, getTimeline);
router.post("/:id/like", protect, likeWhisper);
router.post("/:id/dislike", protect, dislikeWhisper);
router.post("/:id/comment", protect, addComment);
router.post("/:id/comment/:commentId/reply", protect, replyToComment);
router.put("/:id/comment/:commentId", protect, editComment);
router.delete("/:id/comment/:commentId", protect, deleteComment);
router.put("/:id/comment/:commentId/reply/:replyId", protect, editReply);
router.delete("/:id/comment/:commentId/reply/:replyId", protect, deleteReply);

export default router;
