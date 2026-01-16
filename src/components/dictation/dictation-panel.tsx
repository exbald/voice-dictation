"use client";

import { AlertCircle, Mic, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSTTProvider } from "@/contexts/stt-provider-context";
import { useVoiceDictation } from "@/hooks/use-voice-dictation";
import { cn } from "@/lib/utils";
import { KeyboardHint } from "./keyboard-hint";
import { MicButton } from "./mic-button";
import { TranscriptDisplay } from "./transcript-display";
import { WaveformVisualizer } from "./waveform-visualizer";

export function DictationPanel() {
  const { provider } = useSTTProvider();
  const {
    status,
    interimTranscript,
    finalTranscript,
    error,
    permissionStatus,
    requestPermission,
    mediaStream,
    clearTranscript,
    isCtrlHeld,
  } = useVoiceDictation(provider);

  // Show permission request if not granted
  if (permissionStatus === "prompt") {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-16">
        <div className="relative">
          <div className="rounded-full bg-muted/50 p-8">
            <Mic className="h-16 w-16 text-muted-foreground/50" />
          </div>
        </div>
        <div className="text-center space-y-3 max-w-sm">
          <h2 className="text-xl font-medium">Enable Microphone</h2>
          <p className="text-sm text-muted-foreground">
            Voice dictation needs microphone access to transcribe your speech in real-time.
          </p>
        </div>
        <Button onClick={requestPermission} size="lg" className="rounded-full px-8">
          <Mic className="mr-2 h-4 w-4" />
          Allow Access
        </Button>
      </div>
    );
  }

  // Show instructions when permission is denied
  if (permissionStatus === "denied") {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-16">
        <div className="rounded-full bg-destructive/10 p-8">
          <AlertCircle className="h-16 w-16 text-destructive/70" />
        </div>
        <div className="text-center space-y-3 max-w-sm">
          <h2 className="text-xl font-medium">Access Blocked</h2>
          <p className="text-sm text-muted-foreground">
            Microphone access was denied. To enable it:
          </p>
          <ol className="text-sm text-muted-foreground text-left list-decimal list-inside space-y-1">
            <li>Click the lock icon in your address bar</li>
            <li>Find &quot;Microphone&quot; in permissions</li>
            <li>Change from &quot;Block&quot; to &quot;Allow&quot;</li>
            <li>Refresh this page</li>
          </ol>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="rounded-full px-8"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  // Show unsupported browser message
  if (permissionStatus === "unsupported") {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-16">
        <div className="rounded-full bg-destructive/10 p-8">
          <AlertCircle className="h-16 w-16 text-destructive/70" />
        </div>
        <div className="text-center space-y-3 max-w-sm">
          <h2 className="text-xl font-medium">Browser Not Supported</h2>
          <p className="text-sm text-muted-foreground">
            Your browser doesn&apos;t support microphone access. Try Chrome, Firefox, or Edge.
          </p>
        </div>
      </div>
    );
  }

  const hasTranscript = finalTranscript || interimTranscript;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Hero mic button with waveform */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
        {/* Circular waveform behind the button */}
        <WaveformVisualizer
          stream={mediaStream}
          isRecording={status === "recording"}
          size={224}
        />
        {/* Main mic button */}
        <MicButton status={status} isCtrlHeld={isCtrlHeld} />
      </div>

      {/* Keyboard hint */}
      <KeyboardHint status={status} />

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive max-w-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transcript section */}
      <div className="w-full max-w-xl space-y-4">
        <TranscriptDisplay
          finalTranscript={finalTranscript}
          interimTranscript={interimTranscript}
        />

        {/* Actions - only show when there's a transcript */}
        <div
          className={cn(
            "flex justify-center gap-3 transition-all duration-300",
            hasTranscript ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText(finalTranscript)}
            className="rounded-full"
            disabled={!finalTranscript}
          >
            <Copy className="mr-2 h-3.5 w-3.5" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearTranscript}
            className="rounded-full text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
