"use client";

import { cn } from "@/lib/utils";

interface TranscriptDisplayProps {
  finalTranscript: string;
  interimTranscript: string;
  className?: string;
}

export function TranscriptDisplay({
  finalTranscript,
  interimTranscript,
  className,
}: TranscriptDisplayProps) {
  const hasContent = finalTranscript || interimTranscript;

  if (!hasContent) {
    return (
      <div
        className={cn(
          "text-center py-8 text-muted-foreground/50",
          className
        )}
      >
        <p className="text-sm">Your transcript will appear here</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-muted/30 border border-border/50 p-6 backdrop-blur-sm",
        className
      )}
    >
      <p className="text-lg leading-relaxed">
        {/* Final transcript - solid text */}
        <span className="text-foreground">{finalTranscript}</span>
        {/* Interim transcript - faded, still processing */}
        {interimTranscript && (
          <span className="text-muted-foreground/70 animate-pulse">
            {finalTranscript ? " " : ""}
            {interimTranscript}
          </span>
        )}
      </p>
    </div>
  );
}
