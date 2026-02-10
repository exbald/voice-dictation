# Implementation Plan: Add Mistral Voxtral Realtime STT Provider

## Overview

Add Mistral Voxtral Realtime as a third STT provider by implementing the existing `STTProvider` interface, creating a token API endpoint, and wiring Mistral into the UI and configuration layers. The work splits into 3 independent groups that can be implemented in parallel.

## Phase 1: Core STT Layer

Register Mistral as a valid provider type and implement the provider class.

### Tasks

- [ ] Add "mistral" to `STTProviderType` union and `VALID_PROVIDERS` array in `src/lib/stt/types.ts`
- [ ] Create `src/lib/stt/mistral-provider.ts` implementing `STTProvider` interface [complex]
  - [ ] `fetchCredentials()` — GET `/api/mistral/token`, return `{ apiKey, websocketUrl }`
  - [ ] `createWebSocket()` — create WebSocket from credentials URL (API key in query param)
  - [ ] `createRecorder()` — reuse `PCMRecorder`, send audio as `{ type: "input_audio.append", audio: "<base64>" }`
  - [ ] `parseMessage()` — handle `transcription.text.delta` (interim), `transcription.segment` (final), `error`
  - [ ] `int16ToBase64()` — private helper (same pattern as ElevenLabs provider)
- [ ] Add Mistral to factory in `src/lib/stt/index.ts` — import + `case "mistral"`
- [ ] Add Mistral pricing to `src/lib/cost.ts` — `{ costPerMinute: 0.006, name: "Mistral Voxtral Realtime" }`

### Technical Details

**types.ts changes (line 6, 8):**
```typescript
export type STTProviderType = "deepgram" | "elevenlabs" | "mistral";
const VALID_PROVIDERS: STTProviderType[] = ["deepgram", "elevenlabs", "mistral"];
```

**mistral-provider.ts — Key implementation patterns:**

Audio send format (different from ElevenLabs):
```typescript
ws.send(JSON.stringify({
  type: "input_audio.append",
  audio: base64EncodedPcm,
}));
```

Message parsing — Mistral event types:
```typescript
// Interim text
{ type: "transcription.text.delta", text: "hello" }
// Final segment
{ type: "transcription.segment", text: "hello world" }
// Stream end
{ type: "transcription.done" }
// Error
{ type: "error", error: { message: "..." } }
```

Reuse `PCMRecorder` from `src/lib/stt/pcm-recorder.ts` (same 16kHz PCM format as ElevenLabs). Reuse `int16ToBase64()` pattern from `src/lib/stt/elevenlabs-provider.ts:114-121`.

**index.ts factory addition:**
```typescript
import { MistralProvider } from "./mistral-provider";
// in switch:
case "mistral":
  return new MistralProvider();
```

**cost.ts addition:**
```typescript
mistral: { costPerMinute: 0.006, name: "Mistral Voxtral Realtime" },
```

Note: `PROVIDER_COSTS` uses `satisfies Record<STTProviderType, ...>` so TypeScript will enforce Mistral's inclusion once the type union is updated.

## Phase 2: API Routes

Create the token endpoint and register Mistral in provider availability.

### Tasks

- [ ] Create `src/app/api/mistral/token/route.ts` — token endpoint following Deepgram pattern
- [ ] Add Mistral to provider list in `src/app/api/stt/providers/route.ts`
- [ ] Update error messages in `src/app/api/settings/api-keys/route.ts` to include "mistral"

### Technical Details

**Token endpoint (`src/app/api/mistral/token/route.ts`):**
Follow the Deepgram pattern from `src/app/api/deepgram/token/route.ts`:
1. Authenticate user via `auth.api.getSession({ headers: await headers() })`
2. Get decrypted key via `getUserApiKey(session.user.id, "mistral")` from `src/app/api/settings/api-keys/route.ts`
3. Build WebSocket URL:
```typescript
const params = new URLSearchParams({
  model: "voxtral-mini-transcribe-realtime-2602",
  api_key: apiKey,
});
const websocketUrl = `wss://api.mistral.ai/v1/audio/transcriptions/realtime?${params.toString()}`;
```
4. Return `{ apiKey, websocketUrl }` with `Cache-Control: no-store, no-cache, must-revalidate`

**providers/route.ts addition:**
```typescript
mistral: {
  available: true,
  hasKey: configuredProviders.has("mistral"),
  name: "Mistral",
  model: "Voxtral Realtime",
},
```

**api-keys/route.ts error message updates:**
- Line 59: `"Invalid provider. Must be 'deepgram', 'elevenlabs', or 'mistral'"`
- Line 113: Same update

## Phase 3: UI Components & Context

Add Mistral to all user-facing provider selection UI.

### Tasks

- [ ] Add Mistral to provider form in `src/components/settings/api-key-form.tsx`
- [ ] Add Mistral option to provider toggle in `src/components/ui/provider-toggle.tsx`
- [ ] Add Mistral to default availability in `src/contexts/stt-provider-context.tsx`

### Technical Details

**api-key-form.tsx:**
```typescript
type Provider = "deepgram" | "elevenlabs" | "mistral";

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "deepgram", label: PROVIDER_COSTS.deepgram.name },
  { value: "elevenlabs", label: PROVIDER_COSTS.elevenlabs.name },
  { value: "mistral", label: PROVIDER_COSTS.mistral.name },
];
```

**provider-toggle.tsx:**
```typescript
{ value: "mistral", label: "Mistral", description: "Voxtral Realtime" },
```

**stt-provider-context.tsx DEFAULT_AVAILABILITY:**
```typescript
mistral: { available: true, hasKey: false, name: "Mistral", model: "Voxtral Realtime" },
```

## Phase 4: Verification

Run after all 3 phases complete.

### Tasks

- [ ] Run `npm run lint && npm run typecheck` — fix any errors
- [ ] Verify provider toggle shows 3 options in browser

### Technical Details

The `STTProviderType` union change cascades through:
- `PROVIDER_COSTS` (`satisfies Record<STTProviderType, ...>`) — will error if missing
- `ProvidersAvailability = Record<STTProviderType, ProviderInfo>` — will error if missing
- `DEFAULT_AVAILABILITY` — will error if missing
- `createProvider()` switch — should have all cases

These TypeScript constraints serve as automatic verification that all touchpoints have been updated.

## Parallel Execution Strategy

Phases 1, 2, and 3 have **zero file overlap** and can run as 3 parallel agents:

| Agent | Phase | Files | Description |
|-------|-------|-------|-------------|
| Agent 1 | Phase 1 | `types.ts`, `mistral-provider.ts`, `index.ts`, `cost.ts` | Core STT layer |
| Agent 2 | Phase 2 | `mistral/token/route.ts`, `providers/route.ts`, `api-keys/route.ts` | API routes |
| Agent 3 | Phase 3 | `api-key-form.tsx`, `provider-toggle.tsx`, `stt-provider-context.tsx` | UI + context |

Phase 4 (verification) runs sequentially after all agents complete.
