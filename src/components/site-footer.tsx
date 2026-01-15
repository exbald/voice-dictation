"use client";

import { useSTTProvider } from "@/contexts/stt-provider-context";

const PROVIDER_NAMES: Record<string, string> = {
  deepgram: "Deepgram",
  elevenlabs: "ElevenLabs",
};

export function SiteFooter() {
  const { provider } = useSTTProvider();
  const providerName = PROVIDER_NAMES[provider] || "Deepgram";

  return (
    <footer className="py-4 text-center">
      <p className="text-xs text-muted-foreground/50">
        Powered by {providerName}
      </p>
    </footer>
  );
}
