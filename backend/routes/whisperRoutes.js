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
  likeComment,
  dislikeComment,
  likeReply,
  dislikeReply,
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
router.post("/:id/comment/:commentId/like", protect, likeComment);
router.post("/:id/comment/:commentId/dislike", protect, dislikeComment);
router.put("/:id/comment/:commentId/reply/:replyId", protect, editReply);
router.delete("/:id/comment/:commentId/reply/:replyId", protect, deleteReply);
router.post("/:id/comment/:commentId/reply/:replyId/like", protect, likeReply);
router.post(
  "/:id/comment/:commentId/reply/:replyId/dislike",
  protect,
  dislikeReply
);

export default router;
