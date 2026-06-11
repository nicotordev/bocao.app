"use client";

import { useState } from "react";
import { TbSend } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { WhatsAppInboxLabels } from "./types";

type MessageComposerProps = {
  labels: WhatsAppInboxLabels;
  disabled?: boolean;
  isSending?: boolean;
  onSend: (body: string) => Promise<void>;
};

export function MessageComposer({
  labels,
  disabled = false,
  isSending = false,
  onSend,
}: MessageComposerProps) {
  const [body, setBody] = useState("");

  const handleSubmit = async () => {
    const trimmed = body.trim();

    if (!trimmed || disabled || isSending) {
      return;
    }

    await onSend(trimmed);
    setBody("");
  };

  return (
    <div className="space-y-3 border-t border-border/60 bg-card/20 p-4">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={labels.messagePlaceholder}
        rows={3}
        disabled={disabled || isSending}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void handleSubmit();
          }
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" disabled>
          {labels.suggestAiReply}
        </Button>
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={disabled || isSending || body.trim().length === 0}
        >
          <TbSend className="size-4" aria-hidden />
          {labels.sendMessage}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{labels.suggestAiReplySoon}</p>
    </div>
  );
}
