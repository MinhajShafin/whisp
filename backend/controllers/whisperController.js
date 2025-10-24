import Whisper from "../models/whisperModel.js";
import User from "../models/userModel.js";

// Create a new whisper (protected route)
export const createWhisper = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const whisper = await Whisper.create({
      user: req.user._id, // from JWT middleware
      content: content.trim(),
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

// Timeline feed for logged-in user
export const getTimeline = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Include only whispers from self and friends, excluding blocked users
    const allowedUsers = user.friends.filter(
      (friendId) => !user.blocked.includes(friendId)
    );
    allowedUsers.push(user._id); // include self

    const feed = await Whisper.find({ user: { $in: allowedUsers } })
      .sort({ createdAt: -1 })
      .populate("user", "username avatar") // whisper author
      .populate("comments.user", "username avatar") // comment authors
      .populate("comments.replies.user", "username avatar"); // reply authors

    // Add points dynamically
    const enrichedFeed = feed.map((whisper) => {
      const points =
        (whisper.likes?.length || 0) - (whisper.dislikes?.length || 0);

      // Sort comments by date (newest first)
      const sortedComments = whisper.comments
        ?.map((comment) => ({
          ...comment.toObject(),
          replies: comment.replies
            ?.map((reply) => reply.toObject())
            .sort((a, b) => b.createdAt - a.createdAt),
        }))
        .sort((a, b) => b.createdAt - a.createdAt);

      return {
        ...whisper.toObject(),
        points,
        comments: sortedComments,
      };
    });

    res.status(200).json(enrichedFeed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch timeline" });
  }
};

// Like a whisper
export const likeWhisper = async (req, res) => {
  try {
    const whisper = await Whisper.findById(req.params.id);
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    const userId = req.user._id.toString();

    // Remove user from dislikes if present
    whisper.dislikes = whisper.dislikes.filter(
      (id) => id.toString() !== userId
    );

    // Toggle like
    if (whisper.likes.includes(userId)) {
      whisper.likes = whisper.likes.filter((id) => id.toString() !== userId);
      await whisper.save();
      return res.status(200).json({ message: "Like removed" });
    } else {
      whisper.likes.push(userId);
      await whisper.save();
      return res.status(200).json({ message: "Liked" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to like whisper" });
  }
};

// Dislike a whisper
export const dislikeWhisper = async (req, res) => {
  try {
    const whisper = await Whisper.findById(req.params.id);
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    const userId = req.user._id.toString();

    // Remove user from likes if present
    whisper.likes = whisper.likes.filter((id) => id.toString() !== userId);

    // Toggle dislike
    if (whisper.dislikes.includes(userId)) {
      whisper.dislikes = whisper.dislikes.filter(
        (id) => id.toString() !== userId
      );
      await whisper.save();
      return res.status(200).json({ message: "Dislike removed" });
    } else {
      whisper.dislikes.push(userId);
      await whisper.save();
      return res.status(200).json({ message: "Disliked" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to dislike whisper" });
  }
};

// Add a comment
export const addComment = async (req, res) => {
  try {
    const whisper = await Whisper.findById(req.params.id).populate("user");
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    // Check if user can interact with this whisper
    const currentUser = await User.findById(req.user._id);
    const whisperOwnerId = whisper.user._id.toString();
    const currentUserId = req.user._id.toString();

    // Allow if it's own whisper or if they're friends and not blocked
    const isFriend = currentUser.friends.some(
      (friendId) => friendId.toString() === whisperOwnerId
    );
    const isBlocked = currentUser.blocked.includes(whisperOwnerId);
    const isBlockedBy = whisper.user.blocked?.includes(currentUserId);

    if (
      whisperOwnerId !== currentUserId &&
      (!isFriend || isBlocked || isBlockedBy)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to comment on this whisper" });
    }

    if (!req.body.text || !req.body.text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const newComment = {
      user: req.user._id,
      text: req.body.text.trim(),
    };

    whisper.comments.push(newComment);
    await whisper.save();

    res.status(201).json({ message: "Comment added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

// Reply to a comment
export const replyToComment = async (req, res) => {
  try {
    const whisper = await Whisper.findById(req.params.id).populate("user");
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    const comment = whisper.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Check if user can interact with this whisper
    const currentUser = await User.findById(req.user._id);
    const whisperOwnerId = whisper.user._id.toString();
    const currentUserId = req.user._id.toString();

    const isFriend = currentUser.friends.some(
      (friendId) => friendId.toString() === whisperOwnerId
    );
    const isBlocked = currentUser.blocked.includes(whisperOwnerId);
    const isBlockedBy = whisper.user.blocked?.includes(currentUserId);

    if (
      whisperOwnerId !== currentUserId &&
      (!isFriend || isBlocked || isBlockedBy)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to reply to this comment" });
    }

    if (!req.body.text || !req.body.text.trim()) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const reply = {
      user: req.user._id,
      text: req.body.text.trim(),
    };

    comment.replies.push(reply);
    await whisper.save();

    res.status(201).json({ message: "Reply added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add reply" });
  }
};

// Edit a comment
export const editComment = async (req, res) => {
  try {
    const whisper = await Whisper.findById(req.params.id);
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    const comment = whisper.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this comment" });
    }

    comment.text = req.body.text || comment.text;
    await whisper.save();

    res.status(200).json({ message: "Comment updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to edit comment" });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const whisper = await Whisper.findById(req.params.id);
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    const comment = whisper.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Allow only the comment owner or the whisper owner
    if (
      comment.user.toString() !== req.user._id.toString() &&
      whisper.user.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    comment.deleteOne();
    await whisper.save();

    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

// Edit a reply
export const editReply = async (req, res) => {
  try {
    const whisper = await Whisper.findById(req.params.id);
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    const comment = whisper.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    if (reply.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this reply" });
    }

    reply.text = req.body.text || reply.text;
    await whisper.save();

    res.status(200).json({ message: "Reply updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to edit reply" });
  }
};

// Delete a reply
export const deleteReply = async (req, res) => {
  try {
    const whisper = await Whisper.findById(req.params.id);
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    const comment = whisper.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    // Allow only the reply author or whisper owner
    if (
      reply.user.toString() !== req.user._id.toString() &&
      whisper.user.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this reply" });
    }

    reply.deleteOne();
    await whisper.save();

    res.status(200).json({ message: "Reply deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete reply" });
  }
};
