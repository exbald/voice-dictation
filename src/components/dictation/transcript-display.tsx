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
          "text-center py-8 text-muted-foreground/60",
          className
        )}
      >
        <p className="text-sm">Your transcript will appear here.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl bg-[var(--surface-1)] border border-border/60 p-6 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <p className="text-lg leading-relaxed text-foreground/90">
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
