"use client";

import { Mic, Square } from "lucide-react";
import type { DictationStatus } from "@/lib/deepgram";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  status: DictationStatus;
  isCtrlHeld?: boolean;
}

export function MicButton({ status, isCtrlHeld = false }: MicButtonProps) {
  const isRecording = status === "recording";
  const isProcessing = status === "processing";
  const isCopied = status === "copied";

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring - visible when recording */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-500",
          isRecording
            ? "scale-[1.4] opacity-100 bg-red-500/20 blur-xl"
            : "scale-100 opacity-0"
        )}
      />

      {/* Pulsing ring animation - visible when recording */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 transition-all duration-300",
          isRecording
            ? "scale-[1.2] border-red-500/50 animate-ping"
            : "scale-100 border-transparent"
        )}
      />

      {/* Secondary ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 transition-all duration-500",
          isRecording
            ? "scale-[1.15] border-red-500/30"
            : isCtrlHeld
              ? "scale-[1.1] border-primary/30"
              : "scale-100 border-transparent"
        )}
      />

      {/* Main button */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-300 cursor-default select-none",
          // Size
          "w-32 h-32 sm:w-40 sm:h-40",
          // Base styles
          isRecording
            ? "bg-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)] scale-110"
            : isCopied
              ? "bg-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
              : isProcessing
                ? "bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)] animate-pulse"
                : isCtrlHeld
                  ? "bg-primary/90 shadow-[0_0_40px_rgba(var(--primary),0.3)] scale-105"
                  : "bg-primary/10 hover:bg-primary/15"
        )}
      >
        {/* Icon */}
        {isRecording ? (
          <Square
            className={cn(
              "transition-all duration-300",
              "w-12 h-12 sm:w-14 sm:h-14",
              "text-white fill-white"
            )}
          />
        ) : (
          <Mic
            className={cn(
              "transition-all duration-300",
              "w-12 h-12 sm:w-14 sm:h-14",
              isRecording
                ? "text-white"
                : isCopied
                  ? "text-white"
                  : isProcessing
                    ? "text-white"
                    : isCtrlHeld
                      ? "text-white"
                      : "text-primary"
            )}
          />
        )}
      </div>

      {/* Status ring indicator */}
      <svg
        className={cn(
          "absolute inset-0 w-full h-full -rotate-90 transition-opacity duration-300",
          isProcessing ? "opacity-100" : "opacity-0"
        )}
      >
        <circle
          cx="50%"
          cy="50%"
          r="48%"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="30 10"
          className="text-blue-500 animate-spin"
          style={{ animationDuration: "3s" }}
        />
      </svg>
    </div>
  );
}
