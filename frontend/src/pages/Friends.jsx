import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Users, UserPlus, UserMinus } from "lucide-react";

export default function Friends() {
  const [activeTab, setActiveTab] = useState("friends"); // friends, incoming, outgoing
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError("");
      const [friendsRes, incomingRes, outgoingRes] = await Promise.all([
        axiosInstance.get("/friends/friends"),
        axiosInstance.get("/friends/requests"),
        axiosInstance.get("/friends/outgoing"),
      ]);
      setFriends(friendsRes.data);
      setIncomingRequests(incomingRes.data);
      setOutgoingRequests(outgoingRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load friends data");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfriend = async (friendId) => {
    try {
      await axiosInstance.delete(`/friends/${friendId}`);
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
    } catch (err) {
      console.error("Failed to unfriend:", err);
    }
  };

  const handleAcceptRequest = async (senderId) => {
    try {
      await axiosInstance.post("/friends/accept", { senderId });
      setIncomingRequests((prev) => prev.filter((r) => r._id !== senderId));
      // Refresh friends list
      const res = await axiosInstance.get("/friends/friends");
      setFriends(res.data);
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  const handleRejectRequest = async (senderId) => {
    try {
      await axiosInstance.post("/friends/reject", { senderId });
      setIncomingRequests((prev) => prev.filter((r) => r._id !== senderId));
    } catch (err) {
      console.error("Failed to reject request:", err);
    }
  };

  const handleCancelRequest = async (receiverId) => {
    try {
      await axiosInstance.post("/friends/cancel", { receiverId });
      setOutgoingRequests((prev) => prev.filter((r) => r._id !== receiverId));
    } catch (err) {
      console.error("Failed to cancel request:", err);
    }
  };

  const renderUserCard = (user, actions) => (
    <div
      key={user._id}
      className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow"
    >
      <Link
        to={`/profile/${user._id}`}
        className="flex items-center gap-3 flex-1"
      >
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
          {user.username?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">@{user.username}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </Link>
      <div className="flex gap-2">{actions}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab("friends")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "friends"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Friends ({friends.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "incoming"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Requests ({incomingRequests.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "outgoing"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <UserMinus className="w-4 h-4" />
            Sent ({outgoingRequests.length})
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeTab === "friends" && (
          <>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No friends yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Search for users to add friends
                </p>
              </div>
            ) : (
              friends.map((friend) =>
                renderUserCard(
                  friend,
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnfriend(friend._id)}
                  >
                    Unfriend
                  </Button>
                )
              )
            )}
          </>
        )}

        {activeTab === "incoming" && (
          <>
            {incomingRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No incoming requests</p>
              </div>
            ) : (
              incomingRequests.map((request) =>
                renderUserCard(
                  request,
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(request._id)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectRequest(request._id)}
                    >
                      Reject
                    </Button>
                  </>
                )
              )
            )}
          </>
        )}

        {activeTab === "outgoing" && (
          <>
            {outgoingRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserMinus className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No pending sent requests
                </p>
              </div>
            ) : (
              outgoingRequests.map((request) =>
                renderUserCard(
                  request,
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelRequest(request._id)}
                  >
                    Cancel
                  </Button>
                )
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
