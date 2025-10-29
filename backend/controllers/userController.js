import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import Whisper from "../models/whisperModel.js";
import Message from "../models/messageModel.js";
import TokenBlacklist from "../models/tokenBlacklistModel.js";

// helper function to create token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register new user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Simple validation
    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length < 3 ||
      username.trim().length > 32
    ) {
      return res
        .status(400)
        .json({ message: "Username must be 3-32 characters." });
    }
    if (
      !email ||
      typeof email !== "string" ||
      !email.includes("@") ||
      email.length > 64
    ) {
      return res
        .status(400)
        .json({ message: "Valid email required (max 64 chars)." });
    }
    if (
      !password ||
      typeof password !== "string" ||
      password.length < 6 ||
      password.length > 64
    ) {
      return res
        .status(400)
        .json({ message: "Password must be 6-64 characters." });
    }

    // Prevent duplicate username
    const usernameExists = await User.findOne({ username: username.trim() });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Prevent duplicate email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      username: username.trim(),
      email: email.trim(),
      password,
    });
    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    // Handle duplicate key errors from unique indexes gracefully
    if (error && error.code === 11000) {
      const fields = Object.keys(error.keyPattern || {});
      let message = "Duplicate field value";
      if (fields.includes("username")) message = "Username already taken";
      else if (fields.includes("email")) message = "Email already registered";
      return res.status(400).json({ message });
    }
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};

// Login existing user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple validation
    if (
      !email ||
      typeof email !== "string" ||
      !email.includes("@") ||
      email.length > 64
    ) {
      return res
        .status(400)
        .json({ message: "Valid email required (max 64 chars)." });
    }
    if (
      !password ||
      typeof password !== "string" ||
      password.length < 6 ||
      password.length > 64
    ) {
      return res
        .status(400)
        .json({ message: "Password must be 6-64 characters." });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token,
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};

// Block a user
export const blockUser = async (req, res) => {
  const blockerId = req.user._id;
  const { userId } = req.params; // user to block

  try {
    if (blockerId.toString() === userId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const blocker = await User.findById(blockerId);
    const targetUser = await User.findById(userId);

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (blocker.blocked.some((id) => id.toString() === userId)) {
      return res.status(400).json({ message: "User already blocked" });
    }

    // Remove each other from friends list
    blocker.friends = blocker.friends.filter((id) => id.toString() !== userId);
    targetUser.friends = targetUser.friends.filter(
      (id) => id.toString() !== blockerId.toString()
    );

    // Remove pending friend requests between the pair
    blocker.friendRequests = blocker.friendRequests.filter(
      (id) => id.toString() !== userId
    );
    targetUser.friendRequests = targetUser.friendRequests.filter(
      (id) => id.toString() !== blockerId.toString()
    );

    // Add to blocked list
    blocker.blocked.push(userId);

    await blocker.save();
    await targetUser.save();

    res
      .status(200)
      .json({ message: `User ${targetUser.username} blocked successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to block user" });
  }
};

// Unblock a user
export const unblockUser = async (req, res) => {
  const blockerId = req.user._id;
  const { userId } = req.params; // user to unblock

  try {
    const blocker = await User.findById(blockerId);

    if (!blocker.blocked.some((id) => id.toString() === userId)) {
      return res.status(400).json({ message: "User is not blocked" });
    }

    // Remove the user from blocked array
    blocker.blocked = blocker.blocked.filter((id) => id.toString() !== userId);
    await blocker.save();

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to unblock user" });
  }
};

// Get all blocked users for logged-in user
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "blocked",
      "username email"
    );

    res.status(200).json(user.blocked); // array of blocked user objects
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get blocked users" });
  }
};

// Get user profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("friends", "username email")
      .populate("friendRequests", "_id");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Count whispers by this user
    const whisperCount = await Whisper.countDocuments({ user: user._id });

    // Compute relationship flags relative to requester
    const requesterId = req.user._id.toString();
    const targetId = user._id.toString();
    const isSelf = requesterId === targetId;

    const requester = await User.findById(req.user._id).select(
      "friends blocked friendRequests"
    );

    const requesterFriendIds = new Set(
      requester.friends.map((f) => f.toString())
    );
    const userFriendIds = new Set(user.friends.map((f) => f._id.toString()));

    const isFriend = requesterFriendIds.has(targetId);
    // Incoming for requester if requester has a request from target
    const hasIncomingRequest = (requester.friendRequests || [])
      .map((f) => f.toString())
      .includes(targetId);

    // Outgoing from requester == target has request from requester
    const hasSentRequest = user.friendRequests
      .map((f) => f._id.toString())
      .includes(requesterId);

    const isBlocked = requester.blocked
      .map((b) => b.toString())
      .includes(targetId);

    // mutual friends count (if not self)
    let mutualCount = 0;
    if (!isSelf) {
      mutualCount = Array.from(userFriendIds).filter((id) =>
        requesterFriendIds.has(id)
      ).length;
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      friendCount: user.friends.length,
      whisperCount,
      mutualFriendsWithRequester: mutualCount,
      createdAt: user.createdAt,
      relationship: {
        isSelf,
        isFriend,
        hasSentRequest,
        hasIncomingRequest,
        isBlocked,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.username = req.body.username || user.username;
    user.bio = req.body.bio || user.bio;
    user.avatar = req.body.avatar || user.avatar;

    await user.save();

    res.status(200).json({
      _id: user._id,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      friendCount: user.friends.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// Search user by username
export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Case-insensitive search
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username.trim()}$`, "i") },
    }).select("_id username");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to search user" });
  }
};

// Change password for the authenticated user
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (
      !currentPassword ||
      typeof currentPassword !== "string" ||
      currentPassword.length < 6 ||
      currentPassword.length > 64
    ) {
      return res
        .status(400)
        .json({ message: "Current password must be 6-64 characters." });
    }

    if (
      !newPassword ||
      typeof newPassword !== "string" ||
      newPassword.length < 6 ||
      newPassword.length > 64
    ) {
      return res
        .status(400)
        .json({ message: "New password must be 6-64 characters." });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    if (currentPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "New password must be different from current" });
    }

    user.password = newPassword; // will be hashed by pre-save hook and will set passwordChangedAt
    await user.save();

    // Blacklist current token to immediately invalidate this session
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
      if (token) {
        const decoded = jwt.decode(token); // read exp without verifying again
        const expiresAt = decoded?.exp
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback 7d
        await TokenBlacklist.create({ token, expiresAt });
      }
    } catch (blErr) {
      // Ignore duplicate blacklist errors or minor issues
      if (blErr?.code !== 11000) {
        console.warn("Token blacklist note:", blErr?.message || blErr);
      }
    }

    return res
      .status(200)
      .json({ message: "Password changed successfully", requireReauth: true });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Failed to change password" });
  }
};

// Delete the authenticated user's account and clean up references
export const deleteMe = async (req, res) => {
  try {
    const userId = req.user._id;

    // Pull userId from other users' arrays to avoid dangling refs
    await Promise.all([
      User.updateMany({ friends: userId }, { $pull: { friends: userId } }),
      User.updateMany(
        { friendRequests: userId },
        { $pull: { friendRequests: userId } }
      ),
      User.updateMany({ blocked: userId }, { $pull: { blocked: userId } }),
    ]);

    // Delete user's content
    await Promise.all([
      Whisper.deleteMany({ user: userId }),
      Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
    ]);

    // Finally delete the user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ message: "Failed to delete account" });
  }
};
