"use client";

import type { DictationStatus } from "@/lib/deepgram";
import { cn } from "@/lib/utils";

interface KeyboardHintProps {
  status: DictationStatus;
  hasTranscript?: boolean;
}

export function KeyboardHint({ status, hasTranscript }: KeyboardHintProps) {
  const isRecording = status === "recording";
  const isCopied = status === "copied";

  return (
    <div className="flex flex-col items-center gap-2">
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
            ? "Release or click to stop"
            : isCopied
              ? "Copied to clipboard"
              : "Hold or click to record"}
        </span>
      </div>

      {/* Clear hint - show when there's a transcript and not recording */}
      {hasTranscript && !isRecording && (
        <div className="flex items-center justify-center gap-2 opacity-40 hover:opacity-60 transition-opacity">
          <kbd className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded border border-border bg-muted/50 text-muted-foreground">
            C
          </kbd>
          <span className="text-xs text-muted-foreground">Clear</span>
        </div>
      )}
    </div>
  );
}
