import User from "../models/userModel.js";

// Send a friend request
export const sendFriendRequest = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  if (senderId.toString() === receiverId) {
    return res.status(400).json({ message: "Cannot send request to yourself" });
  }

  try {
    const receiver = await User.findById(receiverId);

    if (!receiver) return res.status(404).json({ message: "User not found" });

    // Check if already friends
    if (receiver.friends.includes(senderId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if request already sent
    if (receiver.friendRequests.includes(senderId)) {
      return res.status(400).json({ message: "Request already sent" });
    }

    receiver.friendRequests.push(senderId);
    await receiver.save();

    res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send request" });
  }
};

// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
  const { senderId } = req.body;
  const receiverId = req.user._id;

  try {
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (!receiver.friendRequests.includes(senderId)) {
      return res.status(400).json({ message: "No request to accept" });
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
      "username email"
    );
    res.status(200).json(user.friends);
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
