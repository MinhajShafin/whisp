import User from "../models/userModel.js";

// Send a friend request
export const sendFriendRequest = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  // Validation
  if (!receiverId || typeof receiverId !== "string") {
    return res.status(400).json({ message: "Receiver ID is required" });
  }

  if (senderId.toString() === receiverId) {
    return res.status(400).json({ message: "Cannot send request to yourself" });
  }

  try {
    const receiver = await User.findById(receiverId);

    if (!receiver) return res.status(404).json({ message: "User not found" });

    // Check if already friends
    if (receiver.friends.some((id) => id.equals(senderId))) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if request already sent
    if (receiver.friendRequests.some((id) => id.equals(senderId))) {
      return res.status(400).json({ message: "Request already sent" });
    }

    // Check if sender is blocked by receiver
    if (receiver.blocked.some((id) => id.equals(senderId))) {
      return res.status(403).json({ message: "You are blocked by this user" });
    }

    receiver.friendRequests.push(senderId);
    await receiver.save();

    res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Send friend request error:", error);
    res
      .status(500)
      .json({ message: "Failed to send request", error: error.message });
  }
};

// Cancel a sent friend request (by sender)
export const cancelFriendRequest = async (req, res) => {
  const { receiverId } = req.body; // the user who received the request
  const senderId = req.user._id;

  if (!receiverId || typeof receiverId !== "string") {
    return res.status(400).json({ message: "Receiver ID is required" });
  }

  try {
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "User not found" });

    const before = receiver.friendRequests.length;
    receiver.friendRequests = receiver.friendRequests.filter(
      (id) => id.toString() !== senderId.toString()
    );

    if (receiver.friendRequests.length === before) {
      return res.status(400).json({ message: "No pending request to cancel" });
    }

    await receiver.save();
    res.status(200).json({ message: "Friend request cancelled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to cancel friend request" });
  }
};

// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
  const { senderId } = req.body;
  const receiverId = req.user._id;

  try {
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    if (!receiver.friendRequests.some((id) => id.equals(senderId))) {
      return res.status(400).json({ message: "No request to accept" });
    }

    // Prevent duplicate friendships
    if (
      receiver.friends.some((id) => id.equals(senderId)) ||
      sender.friends.some((id) => id.equals(receiverId))
    ) {
      // Clean up pending request if it exists
      receiver.friendRequests = receiver.friendRequests.filter(
        (id) => id.toString() !== senderId
      );
      await receiver.save();
      return res.status(400).json({ message: "Already friends" });
    }

    // Remove from friendRequests and add to friends for both users
    receiver.friendRequests = receiver.friendRequests.filter(
      (id) => id.toString() !== senderId
    );
    receiver.friends.push(senderId);
    sender.friends.push(receiverId);

    await receiver.save();
    await sender.save();

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to accept request" });
  }
};

// Reject a friend request
export const rejectFriendRequest = async (req, res) => {
  const { senderId } = req.body;
  const receiverId = req.user._id;

  try {
    const receiver = await User.findById(receiverId);

    receiver.friendRequests = receiver.friendRequests.filter(
      (id) => id.toString() !== senderId
    );

    await receiver.save();
    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to reject request" });
  }
};

// Get friend list
export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friends",
      "username email blocked"
    );

    // Exclude blocked users
    const blockedIds = new Set(user.blocked.map((id) => id.toString()));
    const visibleFriends = user.friends.filter(
      (friend) => !blockedIds.has(friend._id.toString())
    );

    res.status(200).json(visibleFriends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get friends" });
  }
};

// Get pending friend requests
export const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friendRequests",
      "username email"
    );
    res.status(200).json(user.friendRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get friend requests" });
  }
};

// Get outgoing friend requests (requests sent by current user)
export const getOutgoingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all users who have the current user in their friendRequests
    const usersWithRequest = await User.find({
      friendRequests: userId,
    }).select("_id username email");

    res.status(200).json(usersWithRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get outgoing requests" });
  }
};

// Remove a friend
export const removeFriend = async (req, res) => {
  const userId = req.user._id;
  const { friendId } = req.params;

  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove each other from friends list
    user.friends = user.friends.filter((id) => id.toString() !== friendId);
    friend.friends = friend.friends.filter(
      (id) => id.toString() !== userId.toString()
    );

    await user.save();
    await friend.save();

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove friend" });
  }
};

// Get mutual friends between logged-in user and a specific friend
export const getMutualFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.params;

    // Find both users
    const user = await User.findById(userId).populate(
      "friends",
      "username email"
    );
    const friend = await User.findById(friendId).populate(
      "friends",
      "username email"
    );

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get mutual friends
    const userFriendIds = user.friends.map((f) => f._id.toString());
    const mutual = friend.friends.filter((f) =>
      userFriendIds.includes(f._id.toString())
    );

    res.status(200).json(mutual);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get mutual friends" });
  }
};
