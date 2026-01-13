"use client";

import type { DictationStatus } from "@/lib/deepgram";
import { cn } from "@/lib/utils";

interface KeyboardHintProps {
  status: DictationStatus;
}

export function KeyboardHint({ status }: KeyboardHintProps) {
  const isRecording = status === "recording";
  const isCopied = status === "copied";

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 transition-all duration-300",
        isRecording ? "opacity-80" : "opacity-60 hover:opacity-80"
      )}
    >
      <kbd
        className={cn(
          "inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-300",
          isRecording
            ? "border-red-500/50 bg-red-500/10 text-red-400"
            : isCopied
              ? "border-green-500/50 bg-green-500/10 text-green-400"
              : "border-border bg-muted/50 text-muted-foreground"
        )}
      >
        Ctrl
      </kbd>
      <span
        className={cn(
          "text-sm transition-colors duration-300",
          isRecording
            ? "text-red-400"
            : isCopied
              ? "text-green-400"
              : "text-muted-foreground"
        )}
      >
        {isRecording
          ? "Release to stop"
          : isCopied
            ? "Copied to clipboard"
            : "Hold to record"}
      </span>
    </div>
  );
}
