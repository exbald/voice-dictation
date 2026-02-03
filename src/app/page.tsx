"use client";

import { DictationPanel } from "@/components/dictation/dictation-panel";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl">
        {/* Hero section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-2">
            Vox
          </h1>
          <p className="text-muted-foreground">
            Hold <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted mx-1">Ctrl</kbd> to record
          </p>
        </div>

        {/* Main dictation interface */}
        <DictationPanel />
      </div>
    </main>
  );
}
