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
          isRecording ? "opacity-90" : "opacity-70 hover:opacity-90"
        )}
      >
        <kbd
          className={cn(
            "inline-flex items-center justify-center px-3 py-1 text-[11px] font-semibold rounded-full border transition-all duration-300 font-mono",
            isRecording
              ? "border-[rgba(217,112,73,0.5)] bg-[rgba(217,112,73,0.12)] text-[rgba(217,112,73,0.9)]"
              : isCopied
                ? "border-[rgba(60,160,110,0.5)] bg-[rgba(60,160,110,0.12)] text-[rgba(60,160,110,0.9)]"
                : "border-border/70 bg-muted/60 text-muted-foreground"
          )}
        >
          Ctrl
        </kbd>
        <span
          className={cn(
            "text-sm transition-colors duration-300",
            isRecording
              ? "text-[rgba(217,112,73,0.9)]"
              : isCopied
                ? "text-[rgba(60,160,110,0.9)]"
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
        <div className="flex items-center justify-center gap-2 opacity-50 hover:opacity-70 transition-opacity">
          <kbd className="inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full border border-border/70 bg-muted/60 text-muted-foreground font-mono">
            C
          </kbd>
          <span className="text-xs text-muted-foreground">Clear</span>
        </div>
      )}
    </div>
  );
}
