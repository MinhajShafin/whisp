import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function EditProfileModal({ isOpen, onClose, profile, onSave }) {
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }

    if (formData.username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    if (formData.username.trim().length > 32) {
      setError("Username must be less than 32 characters");
      return;
    }

    if (formData.bio && formData.bio.length > 160) {
      setError("Bio must be less than 160 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        username: formData.username.trim(),
        bio: formData.bio.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setError("");
    setFormData({
      username: profile?.username || "",
      bio: profile?.bio || "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Changes will be visible to all
            users.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              disabled={isSubmitting}
              maxLength={32}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.username.length}/32 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              disabled={isSubmitting}
              maxLength={160}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/160 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
