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
          status === "recording" && "bg-red-500 animate-pulse",
          status === "processing" && "bg-blue-500 animate-pulse",
          status === "copied" && "bg-green-500",
          status === "error" && "bg-red-500"
        )}
      />
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          status === "idle" && "text-muted-foreground",
          status === "recording" && "text-red-500",
          status === "processing" && "text-blue-500",
          status === "copied" && "text-green-500",
          status === "error" && "text-red-500"
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
