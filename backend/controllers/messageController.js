import Message from "../models/messageModel.js";
import User from "../models/userModel.js";

export const sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  // Simple validation
  if (!receiverId || typeof receiverId !== "string") {
    return res.status(400).json({ message: "Receiver ID required." });
  }
  if (
    !content ||
    typeof content !== "string" ||
    content.trim().length < 1 ||
    content.trim().length > 1000
  ) {
    return res
      .status(400)
      .json({ message: "Message content must be 1-1000 characters." });
  }

  try {
    const receiver = await User.findById(receiverId);
    if (!receiver)
      return res.status(404).json({ message: "Receiver not found" });

    // BLOCK CHECK: prevent messages both ways if either has blocked the other
    const sender = await User.findById(senderId);
    if (
      receiver.blocked.some((id) => id.equals(senderId)) ||
      sender.blocked.some((id) => id.equals(receiverId))
    ) {
      return res
        .status(403)
        .json({ message: "Messaging is blocked between these users." });
    }

    // FRIEND CHECK: only friends can message
    if (!receiver.friends.some((id) => id.equals(senderId))) {
      return res
        .status(403)
        .json({ message: "You can only message your friends" });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// Get messages between two users
export const getMessages = async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user._id;

  try {
    const friend = await User.findById(friendId);
    if (!friend) return res.status(404).json({ message: "Friend not found" });

    // Check if they are friends
    if (!friend.friends.some((id) => id.equals(userId))) {
      return res
        .status(403)
        .json({ message: "You are not friends with this user" });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get messages" });
  }
};
