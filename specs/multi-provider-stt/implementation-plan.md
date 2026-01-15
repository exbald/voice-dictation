# Implementation Plan: Multi-Provider STT

## Overview

Add ElevenLabs as an alternative speech-to-text provider alongside Deepgram. The implementation uses a provider abstraction pattern to encapsulate differences in audio format, WebSocket authentication, and message parsing.

## Phase 1: Provider Abstraction Layer

Create the provider interface and types that both providers will implement.

### Tasks

- [x] Create `src/lib/stt/types.ts` with provider interface and common types
- [x] Create `src/lib/stt/index.ts` with factory function and localStorage helpers
- [x] Create `src/lib/stt/deepgram-provider.ts` extracting existing Deepgram logic

### Technical Details

**File: `src/lib/stt/types.ts`**

```typescript
export type STTProviderType = "deepgram" | "elevenlabs";

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
}

export interface ProviderCredentials {
  websocketUrl: string;
  apiKey?: string;   // Deepgram uses in subprotocol
  token?: string;    // ElevenLabs uses in query param
}

export interface STTProvider {
  readonly type: STTProviderType;
  fetchCredentials(): Promise<ProviderCredentials>;
  createWebSocket(credentials: ProviderCredentials): WebSocket;
  createMediaRecorder(stream: MediaStream, onData: (data: Blob) => void): MediaRecorder;
  prepareAudioData(blob: Blob): Promise<string | Blob>;
  sendAudio(ws: WebSocket, data: string | Blob): void;
  parseMessage(event: MessageEvent): TranscriptResult | null;
}
```

**File: `src/lib/stt/index.ts`**

```typescript
const STORAGE_KEY = "stt-provider";

export function createProvider(type: STTProviderType): STTProvider {
  switch (type) {
    case "deepgram": return new DeepgramProvider();
    case "elevenlabs": return new ElevenLabsProvider();
    default: return new DeepgramProvider();
  }
}

export function getSavedProvider(): STTProviderType {
  if (typeof window === "undefined") return "deepgram";
  return (localStorage.getItem(STORAGE_KEY) as STTProviderType) || "deepgram";
}

export function saveProvider(type: STTProviderType): void {
  localStorage.setItem(STORAGE_KEY, type);
}
```

**Deepgram Provider Key Implementation:**

- `fetchCredentials()`: Fetch from `/api/deepgram/token`
- `createWebSocket()`: Use subprotocol auth `new WebSocket(url, ["token", apiKey])`
- `createMediaRecorder()`: WebM Opus format `{ mimeType: "audio/webm;codecs=opus" }`
- `prepareAudioData()`: Return blob as-is (no conversion needed)
- `sendAudio()`: Direct `ws.send(blob)`
- `parseMessage()`: Check `data.type === "Results"`, extract `channel.alternatives[0].transcript`, use `is_final` boolean

---

## Phase 2: Refactor Hook to Use Provider Interface

Modify the voice dictation hook to use the provider abstraction instead of hardcoded Deepgram logic.

### Tasks

- [x] Update `src/hooks/use-voice-dictation.ts` to accept provider type parameter
- [x] Replace direct Deepgram calls with provider interface methods
- [x] Verify Deepgram functionality remains unchanged after refactor

### Technical Details

**Hook Signature Change:**

```typescript
// Before
export function useVoiceDictation(): UseVoiceDictationReturn

// After
export function useVoiceDictation(providerType: STTProviderType = "deepgram"): UseVoiceDictationReturn
```

**Key Refactoring Points in `use-voice-dictation.ts`:**

1. **Provider ref** (around line 50):
```typescript
const providerRef = useRef<STTProvider>(createProvider(providerType));

useEffect(() => {
  providerRef.current = createProvider(providerType);
}, [providerType]);
```

2. **Credentials fetch** (around line 239):
```typescript
// Before: const response = await fetch("/api/deepgram/token");
// After:
const credentials = await provider.fetchCredentials();
```

3. **WebSocket creation** (around line 244):
```typescript
// Before: const ws = new WebSocket(tokenData.websocketUrl, ["token", tokenData.apiKey]);
// After:
const ws = provider.createWebSocket(credentials);
```

4. **MediaRecorder setup** (around line 251):
```typescript
// Before: new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
// After:
const mediaRecorder = provider.createMediaRecorder(stream, async (blob) => {
  const data = await provider.prepareAudioData(blob);
  provider.sendAudio(ws, data);
});
```

5. **Message parsing** (around line 267):
```typescript
// Before: if (isTranscriptResult(data)) { ... }
// After:
const result = provider.parseMessage(event);
if (result) {
  if (result.isFinal) {
    setFinalTranscript((prev) => prev ? `${prev} ${result.text}` : result.text);
    setInterimTranscript("");
  } else {
    setInterimTranscript(result.text);
  }
}
```

---

## Phase 3: ElevenLabs Provider Implementation

Implement the ElevenLabs provider with PCM audio conversion.

### Tasks

- [x] Create `src/lib/stt/elevenlabs-provider.ts` with full provider implementation
- [x] Implement PCM 16kHz conversion using Web Audio API
- [x] Create `src/app/api/elevenlabs/token/route.ts` for credentials endpoint
- [x] Add `ELEVENLABS_API_KEY` to environment validation in `src/lib/env.ts`

### Technical Details

**File: `src/lib/stt/elevenlabs-provider.ts`**

```typescript
export class ElevenLabsProvider implements STTProvider {
  readonly type = "elevenlabs" as const;

  async fetchCredentials(): Promise<ProviderCredentials> {
    const response = await fetch("/api/elevenlabs/token");
    if (!response.ok) throw new Error("Failed to fetch ElevenLabs credentials");
    const data = await response.json();
    return { websocketUrl: data.websocketUrl, token: data.token };
  }

  createWebSocket(credentials: ProviderCredentials): WebSocket {
    // Token already in URL query params
    return new WebSocket(credentials.websocketUrl);
  }

  createMediaRecorder(stream: MediaStream, onData: (data: Blob) => void): MediaRecorder {
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
    recorder.ondataavailable = (e) => e.data.size > 0 && onData(e.data);
    return recorder;
  }

  async prepareAudioData(blob: Blob): Promise<string> {
    const pcmData = await this.convertToPCM(blob);
    return this.arrayBufferToBase64(pcmData);
  }

  sendAudio(ws: WebSocket, data: string): void {
    ws.send(JSON.stringify({
      message_type: "input_audio_chunk",
      audio_base_64: data,
      commit: false,
      sample_rate: 16000
    }));
  }

  parseMessage(event: MessageEvent): TranscriptResult | null {
    const data = JSON.parse(event.data);
    if (data.message_type === "partial_transcript") {
      return { text: data.text || "", isFinal: false };
    }
    if (data.message_type === "committed_transcript") {
      return { text: data.text || "", isFinal: true };
    }
    return null;
  }

  private async convertToPCM(blob: Blob): Promise<ArrayBuffer> {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const pcmData = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      pcmData[i] = Math.max(-32768, Math.min(32767, channelData[i] * 32768));
    }
    await audioContext.close();
    return pcmData.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
```

**File: `src/app/api/elevenlabs/token/route.ts`**

```typescript
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "ElevenLabs API key not configured",
        message: "Add ELEVENLABS_API_KEY to environment variables",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const params = new URLSearchParams({
    model_id: "scribe_v2_realtime",
    token: apiKey,
    commit_strategy: "vad",
    audio_format: "pcm_16000",
    vad_silence_threshold_secs: "1.5",
    vad_threshold: "0.4",
  });

  const websocketUrl = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params.toString()}`;

  return new Response(
    JSON.stringify({ websocketUrl, token: apiKey }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
```

**Environment validation in `src/lib/env.ts`:**

Add to server schema:
```typescript
ELEVENLABS_API_KEY: z.string().optional(),
```

---

## Phase 4: Provider Context and UI

Create React context for provider selection and the UI toggle component.

### Tasks

- [x] Create `src/contexts/stt-provider-context.tsx` with provider state and localStorage sync
- [x] Create `src/components/ui/provider-toggle.tsx` dropdown component
- [x] Update `src/app/layout.tsx` to wrap with `STTProviderProvider`
- [x] Update `src/components/site-header.tsx` to include `ProviderToggle`
- [x] Update `src/components/dictation/dictation-panel.tsx` to use provider context

### Technical Details

**File: `src/contexts/stt-provider-context.tsx`**

```typescript
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { STTProviderType, getSavedProvider, saveProvider } from "@/lib/stt";

interface STTProviderContextValue {
  provider: STTProviderType;
  setProvider: (type: STTProviderType) => void;
}

const STTProviderContext = createContext<STTProviderContextValue | null>(null);

export function STTProviderProvider({ children }: { children: ReactNode }) {
  const [provider, setProviderState] = useState<STTProviderType>("deepgram");

  useEffect(() => {
    setProviderState(getSavedProvider());
  }, []);

  const setProvider = (type: STTProviderType) => {
    setProviderState(type);
    saveProvider(type);
  };

  return (
    <STTProviderContext.Provider value={{ provider, setProvider }}>
      {children}
    </STTProviderContext.Provider>
  );
}

export function useSTTProvider() {
  const context = useContext(STTProviderContext);
  if (!context) throw new Error("useSTTProvider must be used within STTProviderProvider");
  return context;
}
```

**File: `src/components/ui/provider-toggle.tsx`**

Follow `mode-toggle.tsx` pattern:
```typescript
"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSTTProvider } from "@/contexts/stt-provider-context";

const PROVIDERS = [
  { value: "deepgram", label: "Deepgram", description: "Nova-3 model" },
  { value: "elevenlabs", label: "ElevenLabs", description: "Scribe v2 Realtime" },
] as const;

export function ProviderToggle() {
  const { provider, setProvider } = useSTTProvider();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Mic className="h-4 w-4" />
          <span className="hidden sm:inline">
            {PROVIDERS.find(p => p.value === provider)?.label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Speech Provider</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={provider} onValueChange={(v) => setProvider(v as STTProviderType)}>
          {PROVIDERS.map(({ value, label, description }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <div className="flex flex-col">
                <span>{label}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Layout update (`src/app/layout.tsx`):**

```typescript
import { STTProviderProvider } from "@/contexts/stt-provider-context";

// Wrap children:
<STTProviderProvider>
  {children}
</STTProviderProvider>
```

**Header update (`src/components/site-header.tsx`):**

Add to nav group:
```typescript
import { ProviderToggle } from "./ui/provider-toggle";

// In the flex group with other controls:
<ProviderToggle />
```

**DictationPanel update:**

```typescript
import { useSTTProvider } from "@/contexts/stt-provider-context";

export function DictationPanel() {
  const { provider } = useSTTProvider();
  const { status, ... } = useVoiceDictation(provider);
  // rest unchanged
}
```

---

## Phase 5: Error Handling and Polish

Add graceful error handling for missing API keys and connection issues.

### Tasks

- [x] Handle missing ElevenLabs API key gracefully (show message, disable option)
- [x] Add connection error handling with user-friendly messages
- [x] Update CLAUDE.md with new environment variable documentation

### Technical Details

**Error handling in provider toggle:**

Check if ElevenLabs is available before showing in dropdown, or show disabled state with tooltip explaining API key needed.

**CLAUDE.md update:**

```markdown
## Environment Variables

```env
DEEPGRAM_API_KEY=your_deepgram_api_key   # Required for voice dictation
ELEVENLABS_API_KEY=your_elevenlabs_api_key  # Optional, enables ElevenLabs STT provider
POSTGRES_URL=postgresql://...             # For auth features
BETTER_AUTH_SECRET=32_char_random_string  # For auth features
```
```

**Connection error messages:**

- "Failed to connect to speech service. Please try again."
- "Speech provider unavailable. Check your API key configuration."
- Network-specific errors mapped to user-friendly messages
