import Whisper from "../models/whisperModel.js";
import User from "../models/userModel.js";

// Simple pagination helper
const getPagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

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
    const wantsPagination = Boolean(req.query.page || req.query.limit);

    if (!wantsPagination) {
      const whispers = await Whisper.find()
        .sort({ createdAt: -1 })
        .populate("user", "username");
      return res.status(200).json(whispers);
    }

    const { page, limit, skip } = getPagination(req);
    const [totalDocs, whispers] = await Promise.all([
      Whisper.countDocuments({}),
      Whisper.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "username"),
    ]);

    const totalPages = Math.ceil(totalDocs / limit) || 1;
    return res.status(200).json({
      data: whispers,
      pagination: {
        page,
        limit,
        totalDocs,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
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

    const wantsPagination = Boolean(req.query.page || req.query.limit);
    const { page, limit, skip } = getPagination(req);

    const [totalDocs, feed] = await Promise.all([
      wantsPagination
        ? Whisper.countDocuments({ user: { $in: allowedUsers } })
        : Promise.resolve(null),
      Whisper.find({ user: { $in: allowedUsers } })
        .sort({ createdAt: -1 })
        .skip(wantsPagination ? skip : 0)
        .limit(wantsPagination ? limit : 0)
        .populate("user", "username avatar") // whisper author
        .populate("comments.user", "username avatar") // comment authors
        .populate("comments.replies.user", "username avatar"), // reply authors
    ]);

    // Build enriched feed
    const enrichedFeed = feed.map((whisper) => {
      const likeCount = whisper.likes?.length || 0;
      const dislikeCount = whisper.dislikes?.length || 0;
      const points = likeCount - dislikeCount;

      const comments = whisper.comments
        ?.map((comment) => {
          const commentLikeCount = comment.likes?.length || 0;
          const commentDislikeCount = comment.dislikes?.length || 0;
          const commentPoints = commentLikeCount - commentDislikeCount;

          const replies = comment.replies
            ?.map((reply) => ({
              _id: reply._id,
              text: reply.text,
              user: reply.user,
              createdAt: reply.createdAt,
              likeCount: reply.likes?.length || 0,
              dislikeCount: reply.dislikes?.length || 0,
              points:
                (reply.likes?.length || 0) - (reply.dislikes?.length || 0),
            }))
            .sort((a, b) => b.createdAt - a.createdAt);

          return {
            _id: comment._id,
            text: comment.text,
            user: comment.user,
            createdAt: comment.createdAt,
            likeCount: commentLikeCount,
            dislikeCount: commentDislikeCount,
            points: commentPoints,
            replies,
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      return {
        _id: whisper._id,
        content: whisper.content,
        user: whisper.user,
        likes: whisper.likes,
        dislikes: whisper.dislikes,
        likeCount,
        dislikeCount,
        points,
        createdAt: whisper.createdAt,
        comments,
      };
    });

    if (!wantsPagination) {
      return res.status(200).json(enrichedFeed);
    }

    const totalPages = Math.ceil((totalDocs || 0) / limit) || 1;
    return res.status(200).json({
      data: enrichedFeed,
      pagination: {
        page,
        limit,
        totalDocs,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
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
    if (whisper.likes.some((id) => id.toString() === userId)) {
      whisper.likes = whisper.likes.filter((id) => id.toString() !== userId);
      await whisper.save();
      const likeCount = whisper.likes.length;
      const dislikeCount = whisper.dislikes.length;
      const points = likeCount - dislikeCount;
      return res
        .status(200)
        .json({ message: "Like removed", likeCount, dislikeCount, points });
    } else {
      whisper.likes.push(userId);
      await whisper.save();
      const likeCount = whisper.likes.length;
      const dislikeCount = whisper.dislikes.length;
      const points = likeCount - dislikeCount;
      return res
        .status(200)
        .json({ message: "Liked", likeCount, dislikeCount, points });
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
    if (whisper.dislikes.some((id) => id.toString() === userId)) {
      whisper.dislikes = whisper.dislikes.filter(
        (id) => id.toString() !== userId
      );
      await whisper.save();
      const likeCount = whisper.likes.length;
      const dislikeCount = whisper.dislikes.length;
      const points = likeCount - dislikeCount;
      return res
        .status(200)
        .json({ message: "Dislike removed", likeCount, dislikeCount, points });
    } else {
      whisper.dislikes.push(userId);
      await whisper.save();
      const likeCount = whisper.likes.length;
      const dislikeCount = whisper.dislikes.length;
      const points = likeCount - dislikeCount;
      return res
        .status(200)
        .json({ message: "Disliked", likeCount, dislikeCount, points });
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

    // Get the newly added comment and populate user info
    const addedComment = whisper.comments[whisper.comments.length - 1];
    await addedComment.populate("user", "username avatar");

    res.status(201).json({
      message: "Comment added",
      comment: addedComment,
    });
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

    // Get the newly added reply and populate user info
    const addedReply = comment.replies[comment.replies.length - 1];
    await addedReply.populate("user", "username avatar");

    res.status(201).json({
      message: "Reply added",
      reply: addedReply,
    });
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

// Like a comment
export const likeComment = async (req, res) => {
  const { id: whisperId, commentId } = req.params;
  const userId = req.user._id.toString();

  try {
    const whisper = await Whisper.findById(whisperId);
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    const comment = whisper.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Remove from dislikes if present
    comment.dislikes = comment.dislikes.filter(
      (id) => id.toString() !== userId
    );

    if (comment.likes.some((id) => id.toString() === userId)) {
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
      await whisper.save();
      const likeCount = comment.likes.length;
      const dislikeCount = comment.dislikes.length;
      const points = likeCount - dislikeCount;
      return res.status(200).json({
        message: "Like removed",
        comment,
        likeCount,
        dislikeCount,
        points,
      });
    }

    comment.likes.push(userId);
    await whisper.save();
    {
      const likeCount = comment.likes.length;
      const dislikeCount = comment.dislikes.length;
      const points = likeCount - dislikeCount;
      res
        .status(200)
        .json({ message: "Liked", comment, likeCount, dislikeCount, points });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to like comment" });
  }
};

// Dislike a comment
export const dislikeComment = async (req, res) => {
  const { id: whisperId, commentId } = req.params;
  const userId = req.user._id.toString();

  try {
    const whisper = await Whisper.findById(whisperId);
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    const comment = whisper.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Remove from likes if present
    comment.likes = comment.likes.filter((id) => id.toString() !== userId);

    if (comment.dislikes.some((id) => id.toString() === userId)) {
      comment.dislikes = comment.dislikes.filter(
        (id) => id.toString() !== userId
      );
      await whisper.save();
      const likeCount = comment.likes.length;
      const dislikeCount = comment.dislikes.length;
      const points = likeCount - dislikeCount;
      return res.status(200).json({
        message: "Dislike removed",
        comment,
        likeCount,
        dislikeCount,
        points,
      });
    }

    comment.dislikes.push(userId);
    await whisper.save();
    {
      const likeCount = comment.likes.length;
      const dislikeCount = comment.dislikes.length;
      const points = likeCount - dislikeCount;
      res.status(200).json({
        message: "Disliked",
        comment,
        likeCount,
        dislikeCount,
        points,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to dislike comment" });
  }
};

// Like a reply
export const likeReply = async (req, res) => {
  const { id: whisperId, commentId, replyId } = req.params;
  const userId = req.user._id.toString();

  try {
    const whisper = await Whisper.findById(whisperId);
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    const comment = whisper.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    // Remove from dislikes if present
    reply.dislikes = reply.dislikes.filter((id) => id.toString() !== userId);

    // Toggle like
    if (reply.likes.some((id) => id.toString() === userId)) {
      reply.likes = reply.likes.filter((id) => id.toString() !== userId);
      await whisper.save();
      const likeCount = reply.likes.length;
      const dislikeCount = reply.dislikes.length;
      const points = likeCount - dislikeCount;
      return res.status(200).json({
        message: "Like removed",
        reply,
        likeCount,
        dislikeCount,
        points,
      });
    }

    reply.likes.push(userId);
    await whisper.save();
    {
      const likeCount = reply.likes.length;
      const dislikeCount = reply.dislikes.length;
      const points = likeCount - dislikeCount;
      res
        .status(200)
        .json({ message: "Liked", reply, likeCount, dislikeCount, points });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to like reply" });
  }
};

// Dislike a reply
export const dislikeReply = async (req, res) => {
  const { id: whisperId, commentId, replyId } = req.params;
  const userId = req.user._id.toString();

  try {
    const whisper = await Whisper.findById(whisperId);
    if (!whisper) return res.status(404).json({ message: "Whisper not found" });

    const comment = whisper.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ message: "Reply not found" });

    // Remove from likes if present
    reply.likes = reply.likes.filter((id) => id.toString() !== userId);

    // Toggle dislike
    if (reply.dislikes.some((id) => id.toString() === userId)) {
      reply.dislikes = reply.dislikes.filter((id) => id.toString() !== userId);
      await whisper.save();
      const likeCount = reply.likes.length;
      const dislikeCount = reply.dislikes.length;
      const points = likeCount - dislikeCount;
      return res.status(200).json({
        message: "Dislike removed",
        reply,
        likeCount,
        dislikeCount,
        points,
      });
    }

    reply.dislikes.push(userId);
    await whisper.save();
    {
      const likeCount = reply.likes.length;
      const dislikeCount = reply.dislikes.length;
      const points = likeCount - dislikeCount;
      res
        .status(200)
        .json({ message: "Disliked", reply, likeCount, dislikeCount, points });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to dislike reply" });
  }
};
