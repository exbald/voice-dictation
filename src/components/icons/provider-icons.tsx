"use client";

/**
 * Provider icons for STT services.
 * Shared across settings, dashboard, and other components.
 */

import { Key } from "lucide-react";

export function DeepgramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2V7h2v10z" />
    </svg>
  );
}

export function ElevenLabsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4h2v16H7V4zm8 0h2v16h-2V4z" />
    </svg>
  );
}

export function ProviderIcon({
  provider,
  className,
}: {
  provider: string;
  className?: string;
}) {
  // Normalize undefined to not pass the prop at all
  const props = className ? { className } : {};

  if (provider === "deepgram") {
    return <DeepgramIcon {...props} />;
  }
  if (provider === "elevenlabs") {
    return <ElevenLabsIcon {...props} />;
  }
  return <Key {...props} />;
}
