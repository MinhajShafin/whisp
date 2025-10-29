import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriends,
  getFriendRequests,
  removeFriend,
  getMutualFriends,
} from "../controllers/friendController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // all routes are protected

router.post("/request", sendFriendRequest);
router.post("/accept", acceptFriendRequest);
router.post("/reject", rejectFriendRequest);
router.post("/cancel", cancelFriendRequest);
router.get("/friends", getFriends);
router.get("/requests", getFriendRequests);
router.get("/mutual/:friendId", getMutualFriends);
router.delete("/:friendId", removeFriend);

export default router;
