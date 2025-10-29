import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  MoreVertical,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function WhisperCard({
  whisper,
  onLike,
  onDislike,
  currentUserId,
}) {
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);

  const hasLiked = whisper.likes?.includes(currentUserId);
  const hasDisliked = whisper.dislikes?.includes(currentUserId);

  const handleLike = async () => {
    if (isLiking || isDisliking) return;
    setIsLiking(true);
    try {
      await onLike(whisper._id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async () => {
    if (isLiking || isDisliking) return;
    setIsDisliking(true);
    try {
      await onDislike(whisper._id);
    } finally {
      setIsDisliking(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(whisper.createdAt), {
    addSuffix: true,
  });

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
              {whisper.user?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <Link
                to={`/profile/${whisper.user?._id}`}
                className="font-semibold hover:underline"
              >
                @{whisper.user?.username || "unknown"}
              </Link>
              <p className="text-sm text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-base whitespace-pre-wrap wrap-break-word">
          {whisper.content}
        </p>
      </CardContent>

      <CardFooter className="pt-2 border-t flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant={hasLiked ? "default" : "ghost"}
            size="sm"
            onClick={handleLike}
            disabled={isLiking || isDisliking}
            className="gap-1"
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{whisper.likeCount || 0}</span>
          </Button>

          <Button
            variant={hasDisliked ? "destructive" : "ghost"}
            size="sm"
            onClick={handleDislike}
            disabled={isLiking || isDisliking}
            className="gap-1"
          >
            <ThumbsDown className="h-4 w-4" />
            <span>{whisper.dislikeCount || 0}</span>
          </Button>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="font-semibold">
            {whisper.points || 0}{" "}
            {Math.abs(whisper.points || 0) === 1 ? "point" : "points"}
          </span>
        </div>

        <Button variant="ghost" size="sm" className="gap-1 ml-auto">
          <MessageCircle className="h-4 w-4" />
          <span>{whisper.comments?.length || 0}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
