import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import WhisperCard from "@/components/WhisperCard";
import WhisperComposer from "@/components/WhisperComposer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw } from "lucide-react";

export default function Timeline() {
  const { user } = useContext(AuthContext);
  const [whispers, setWhispers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTimeline = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError("");
      const res = await axiosInstance.get("/whispers/timeline");
      setWhispers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const handleCreateWhisper = async (content) => {
    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/whispers", { content });
      // Add new whisper to the top of the feed
      setWhispers([res.data, ...whispers]);
    } catch (err) {
      throw err; // Let WhisperComposer handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (whisperId) => {
    try {
      const res = await axiosInstance.post(`/whispers/${whisperId}/like`);
      // Update whisper in state
      setWhispers((prev) =>
        prev.map((w) =>
          w._id === whisperId
            ? {
                ...w,
                likes:
                  res.data.likeCount > w.likeCount
                    ? [...w.likes, user._id]
                    : w.likes.filter((id) => id !== user._id),
                dislikes: w.dislikes.filter((id) => id !== user._id),
                likeCount: res.data.likeCount,
                dislikeCount: res.data.dislikeCount,
                points: res.data.points,
              }
            : w
        )
      );
    } catch (err) {
      console.error("Failed to like whisper:", err);
    }
  };

  const handleDislike = async (whisperId) => {
    try {
      const res = await axiosInstance.post(`/whispers/${whisperId}/dislike`);
      // Update whisper in state
      setWhispers((prev) =>
        prev.map((w) =>
          w._id === whisperId
            ? {
                ...w,
                likes: w.likes.filter((id) => id !== user._id),
                dislikes:
                  res.data.dislikeCount > w.dislikeCount
                    ? [...w.dislikes, user._id]
                    : w.dislikes.filter((id) => id !== user._id),
                likeCount: res.data.likeCount,
                dislikeCount: res.data.dislikeCount,
                points: res.data.points,
              }
            : w
        )
      );
    } catch (err) {
      console.error("Failed to dislike whisper:", err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTimeline(false);
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Timeline</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <WhisperComposer
        onSubmit={handleCreateWhisper}
        isSubmitting={isSubmitting}
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {whispers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-2">No whispers yet</p>
          <p className="text-sm text-muted-foreground">
            Be the first to share something or add some friends!
          </p>
        </div>
      ) : (
        <div>
          {whispers.map((whisper) => (
            <WhisperCard
              key={whisper._id}
              whisper={whisper}
              onLike={handleLike}
              onDislike={handleDislike}
              currentUserId={user._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
