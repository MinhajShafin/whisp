import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getFriendRequests,
} from "../controllers/friendController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // all routes are protected

router.post("/request", sendFriendRequest);
router.post("/accept", acceptFriendRequest);
router.post("/reject", rejectFriendRequest);
router.get("/friends", getFriends);
router.get("/requests", getFriendRequests);

export default router;
