"use client";

import type { DictationStatus } from "@/lib/deepgram";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: DictationStatus;
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "h-3 w-3 rounded-full transition-all duration-300",
          status === "idle" && "bg-muted-foreground/50",
          status === "recording" &&
            "bg-[rgba(217,112,73,0.95)] animate-pulse",
          status === "processing" &&
            "bg-[rgba(73,135,217,0.95)] animate-pulse",
          status === "copied" && "bg-[rgba(60,160,110,0.95)]",
          status === "error" && "bg-[rgba(217,112,73,0.95)]"
        )}
      />
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          status === "idle" && "text-muted-foreground",
          status === "recording" && "text-[rgba(217,112,73,0.95)]",
          status === "processing" && "text-[rgba(73,135,217,0.95)]",
          status === "copied" && "text-[rgba(60,160,110,0.95)]",
          status === "error" && "text-[rgba(217,112,73,0.95)]"
        )}
      >
        {status === "idle" && "Ready"}
        {status === "recording" && "Recording..."}
        {status === "processing" && "Processing..."}
        {status === "copied" && "Copied!"}
        {status === "error" && "Error"}
      </span>
    </div>
  );
}
