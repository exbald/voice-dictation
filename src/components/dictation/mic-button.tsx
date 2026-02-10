"use client";

import { Mic, Square } from "lucide-react";
import type { DictationStatus } from "@/lib/deepgram";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  status: DictationStatus;
  isCtrlHeld?: boolean;
  onClick?: () => void;
}

export function MicButton({ status, isCtrlHeld = false, onClick }: MicButtonProps) {
  const isRecording = status === "recording";
  const isProcessing = status === "processing";
  const isCopied = status === "copied";

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring - visible when recording */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-500 pointer-events-none",
          isRecording
            ? "scale-[1.4] opacity-100 bg-[rgba(217,112,73,0.2)] blur-xl"
            : "scale-100 opacity-0"
        )}
      />

      {/* Pulsing ring animation - visible when recording */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 transition-all duration-300 pointer-events-none",
          isRecording
            ? "scale-[1.2] border-[rgba(217,112,73,0.5)] animate-ping"
            : "scale-100 border-transparent"
        )}
      />

      {/* Secondary ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full border-2 transition-all duration-500 pointer-events-none",
          isRecording
            ? "scale-[1.15] border-[rgba(217,112,73,0.3)]"
            : isCtrlHeld
              ? "scale-[1.1] border-primary/40"
              : "scale-100 border-transparent"
        )}
      />

      {/* Main button */}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer select-none",
          // Size
          "w-32 h-32 sm:w-40 sm:h-40",
          // Base styles
          isRecording
            ? "bg-[rgba(217,112,73,0.95)] shadow-[0_0_60px_rgba(217,112,73,0.45)] scale-110"
            : isCopied
              ? "bg-[rgba(60,160,110,0.95)] shadow-[0_0_40px_rgba(60,160,110,0.3)]"
              : isProcessing
                ? "bg-[rgba(73,135,217,0.95)] shadow-[0_0_40px_rgba(73,135,217,0.3)] animate-pulse"
                : isCtrlHeld
                  ? "bg-primary/90 shadow-[0_0_40px_rgba(217,112,73,0.2)] scale-105"
                  : "bg-primary/15 hover:bg-primary/20"
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
      </button>

      {/* Status ring indicator */}
      <svg
        className={cn(
          "absolute inset-0 w-full h-full -rotate-90 transition-opacity duration-300 pointer-events-none",
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
          className="text-[rgba(73,135,217,0.9)] animate-spin"
          style={{ animationDuration: "3s" }}
        />
      </svg>
    </div>
  );
}
