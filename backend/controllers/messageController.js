import Message from "../models/messageModel.js";
import User from "../models/userModel.js";

// Send a private message
export const sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  try {
    const receiver = await User.findById(receiverId);
    if (!receiver)
      return res.status(404).json({ message: "Receiver not found" });

    // Check if sender and receiver are friends
    if (!receiver.friends.includes(senderId)) {
      return res
        .status(403)
        .json({ message: "You can only message your friends" });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
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
    if (!friend.friends.includes(userId)) {
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
