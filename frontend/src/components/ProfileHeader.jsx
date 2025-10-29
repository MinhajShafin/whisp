import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function ProfileHeader({
  profile,
  isOwnProfile,
  onEditProfile,
}) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold">
              {profile.username?.[0]?.toUpperCase() || "?"}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">@{profile.username}</h1>
                {profile.bio && (
                  <p className="text-muted-foreground mt-2">{profile.bio}</p>
                )}
              </div>
              {isOwnProfile && (
                <Button variant="outline" onClick={onEditProfile}>
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>{profile.whisperCount || 0}</strong>{" "}
                  {profile.whisperCount === 1 ? "Whisper" : "Whispers"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>{profile.friendCount || 0}</strong>{" "}
                  {profile.friendCount === 1 ? "Friend" : "Friends"}
                </span>
              </div>
              {!isOwnProfile && profile.mutualFriendsWithRequester > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {profile.mutualFriendsWithRequester} mutual{" "}
                    {profile.mutualFriendsWithRequester === 1
                      ? "friend"
                      : "friends"}
                  </span>
                </div>
              )}
              {profile.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
