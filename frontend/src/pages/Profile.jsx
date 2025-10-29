import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import axiosInstance from "@/api/axiosInstance";
import ProfileHeader from "@/components/ProfileHeader";
import WhisperCard from "@/components/WhisperCard";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [whispers, setWhispers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [whispersLoading, setWhispersLoading] = useState(true);

  const isOwnProfile = currentUser?._id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get(`/users/${id}`);
        setProfile(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserWhispers = async () => {
      try {
        setWhispersLoading(true);
        const res = await axiosInstance.get("/whispers");
        // Filter whispers by this user
        const userWhispers = res.data.filter((w) => w.user?._id === id);
        setWhispers(userWhispers);
      } catch (err) {
        console.error("Failed to load whispers:", err);
      } finally {
        setWhispersLoading(false);
      }
    };

    if (id) {
      fetchProfile();
      fetchUserWhispers();
    }
  }, [id]);

  const handleLike = async (whisperId) => {
    try {
      const res = await axiosInstance.post(`/whispers/${whisperId}/like`);
      setWhispers((prev) =>
        prev.map((w) =>
          w._id === whisperId
            ? {
                ...w,
                likes:
                  res.data.likeCount > w.likeCount
                    ? [...w.likes, currentUser._id]
                    : w.likes.filter((id) => id !== currentUser._id),
                dislikes: w.dislikes.filter((id) => id !== currentUser._id),
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
      setWhispers((prev) =>
        prev.map((w) =>
          w._id === whisperId
            ? {
                ...w,
                likes: w.likes.filter((id) => id !== currentUser._id),
                dislikes:
                  res.data.dislikeCount > w.dislikeCount
                    ? [...w.dislikes, currentUser._id]
                    : w.dislikes.filter((id) => id !== currentUser._id),
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

  const handleEditProfile = () => {
    // TODO: Open edit profile modal/page
    alert("Edit profile coming soon!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Alert>
          <AlertDescription>User not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onEditProfile={handleEditProfile}
      />

      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          {isOwnProfile ? "Your Whispers" : `${profile.username}'s Whispers`}
        </h2>
      </div>

      {whispersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : whispers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isOwnProfile
              ? "You haven't posted any whispers yet"
              : "This user hasn't posted any whispers yet"}
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
              currentUserId={currentUser._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
