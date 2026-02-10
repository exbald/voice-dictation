# Requirements: Add Mistral Voxtral Realtime STT Provider

## Summary

Add Mistral's Voxtral Mini Transcribe Realtime (`voxtral-mini-transcribe-realtime-2602`) as a third speech-to-text provider alongside Deepgram Nova-3 and ElevenLabs Scribe v2. This is the user's preferred provider going forward.

## Why

- Mistral Voxtral Realtime is purpose-built for live transcription with sub-200ms latency
- Priced at $0.006/min — competitive with existing providers (Deepgram $0.0043/min, ElevenLabs $0.0067/min)
- Uses a novel streaming architecture that transcribes audio as it arrives (not chunked offline model adaptation)
- Adds provider diversity — three independent STT services for resilience

## What

Users can select "Mistral" as their speech-to-text provider, store their Mistral API key in Settings, and use push-to-talk dictation with Voxtral Realtime transcription via WebSocket streaming.

## Acceptance Criteria

- [ ] Mistral appears as a third option in the provider dropdown (alongside Deepgram and ElevenLabs)
- [ ] Users can add/update/delete a Mistral API key in Settings
- [ ] Selecting Mistral and pressing Ctrl records audio and streams it to Mistral's realtime WebSocket
- [ ] Interim transcripts appear in real-time while recording
- [ ] Final transcripts are accumulated and copied to clipboard on release
- [ ] Cost tracking displays correct Mistral pricing ($0.006/min)
- [ ] Provider selection persists across sessions (localStorage)
- [ ] Providers without configured keys show "(not configured)" in dropdown
- [ ] `npm run typecheck` and `npm run lint` pass with zero errors

## Dependencies

- Existing `STTProvider` interface abstraction (`src/lib/stt/types.ts`)
- Existing `PCMRecorder` class for audio capture (`src/lib/stt/pcm-recorder.ts`) — Mistral uses same PCM 16kHz format as ElevenLabs
- User API key encryption infrastructure (`src/lib/encryption.ts`)
- BetterAuth session authentication

## Technical Context

### Mistral Realtime WebSocket Protocol

- **Model**: `voxtral-mini-transcribe-realtime-2602`
- **WebSocket URL**: `wss://api.mistral.ai/v1/audio/transcriptions/realtime?model=voxtral-mini-transcribe-realtime-2602`
- **Audio format**: PCM 16-bit signed little-endian, 16kHz, mono
- **Audio send message**: `{ type: "input_audio.append", audio: "<base64>" }`
- **Server events**:
  - `session.created` — session established
  - `transcription.text.delta` — interim transcript text
  - `transcription.segment` — final transcript segment
  - `transcription.done` — stream complete
  - `error` — error occurred
- **Auth**: API key as Bearer token in headers (SDK). For browser WebSocket, passed as URL query parameter.

### Related Features

- `specs/multi-provider-stt/` — original multi-provider architecture this builds on
- `specs/multi-tenant-saas/` — user API key storage this leverages
