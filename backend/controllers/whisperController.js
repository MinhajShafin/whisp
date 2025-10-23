import Whisper from "../models/whisperModel.js";

// Create a new whisper (protected route)
export const createWhisper = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const whisper = await Whisper.create({
      user: req.user._id, // from JWT middleware
      content,
    });

    res.status(201).json(whisper);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create whisper" });
  }
};

// Get all whispers (public route)
export const getWhispers = async (req, res) => {
  try {
    const whispers = await Whisper.find()
      .sort({ createdAt: -1 })
      .populate("user", "username"); // populate username

    res.status(200).json(whispers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch whispers" });
  }
};
