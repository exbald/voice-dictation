"use client";

import { useSTTProvider } from "@/contexts/stt-provider-context";

export function SiteFooter() {
  const { provider, availability } = useSTTProvider();
  const modelName = availability?.[provider]?.model || "Voice model";

  return (
    <footer className="py-8 text-center">
      <p className="text-xs text-muted-foreground/70">
        Transcription powered by {modelName}
      </p>
    </footer>
  );
}
