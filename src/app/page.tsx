"use client";

import { DictationPanel } from "@/components/dictation/dictation-panel";

export default function Home() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute -top-28 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(168,95,58,0.18)_0%,rgba(168,95,58,0)_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -left-28 top-40 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(78,118,168,0.14)_0%,rgba(78,118,168,0)_70%)] blur-3xl" />

      <div className="relative container mx-auto px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground/70">
            Editorial dictation studio
          </p>
          <h1 className="text-3xl sm:text-5xl font-serif tracking-tight text-foreground">
            Capture the voice behind the words.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Hold{" "}
            <kbd className="px-2 py-0.5 text-[10px] rounded-full border border-border/70 bg-muted/70 mx-1 font-mono">
              Ctrl
            </kbd>{" "}
            to record, release to copy.
          </p>
        </div>

        <div className="mt-6 sm:mt-8">
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-lg backdrop-blur-sm sm:p-8">
            <DictationPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
