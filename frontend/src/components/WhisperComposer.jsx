import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send } from "lucide-react";

export default function WhisperComposer({ onSubmit, isSubmitting }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const maxLength = 280;
  const remaining = maxLength - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isEmpty) {
      setError("Please write something before posting");
      return;
    }

    if (isOverLimit) {
      setError(`Your whisper is ${Math.abs(remaining)} characters too long`);
      return;
    }

    try {
      await onSubmit(content.trim());
      setContent("");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post whisper");
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="What's on your mind? 🕊️"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            className="min-h-[100px] resize-none"
          />

          <div className="flex items-center justify-between">
            <span
              className={`text-sm ${
                isOverLimit
                  ? "text-red-500 font-semibold"
                  : remaining < 20
                  ? "text-orange-500"
                  : "text-muted-foreground"
              }`}
            >
              {remaining} characters remaining
            </span>

            <Button
              type="submit"
              disabled={isSubmitting || isEmpty || isOverLimit}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post Whisper
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
