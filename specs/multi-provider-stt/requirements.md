# Requirements: Multi-Provider STT

## Overview

Add ElevenLabs as an alternative speech-to-text provider alongside the existing Deepgram integration. Users can switch between providers via a UI toggle in the header.

## Why

- **Provider flexibility**: Different providers excel in different scenarios (accuracy, latency, pricing, language support)
- **Redundancy**: Fallback option if one provider has issues
- **User choice**: Let users pick the provider that works best for their needs
- **Future extensibility**: Architecture supports adding more providers later

## Feature Description

Users see a dropdown in the header showing the current STT provider. Clicking reveals options:
- **Deepgram** (Nova-3 model) - Current default
- **ElevenLabs** (Scribe v2 Realtime) - New option

Switching providers:
1. Takes effect immediately (no page reload required)
2. Persists across sessions via localStorage
3. Works seamlessly with existing push-to-talk flow

## Acceptance Criteria

### Core Functionality
- [ ] User can switch between Deepgram and ElevenLabs via header dropdown
- [ ] Selected provider persists across page reloads (localStorage)
- [ ] Both providers produce transcripts with interim (partial) and final results
- [ ] Existing push-to-talk flow (Ctrl hold/release) works identically with both providers
- [ ] Auto-copy to clipboard works with both providers

### Provider-Specific
- [ ] Deepgram continues to work exactly as before (no regression)
- [ ] ElevenLabs correctly converts audio to PCM 16kHz format
- [ ] ElevenLabs uses VAD-based commit strategy for automatic sentence detection

### Error Handling
- [ ] Graceful error message if provider API key is missing
- [ ] Connection errors show appropriate feedback
- [ ] Missing ElevenLabs key doesn't break the app (falls back to Deepgram or shows message)

### UI/UX
- [ ] Provider toggle follows existing design patterns (similar to theme toggle)
- [ ] Dropdown shows provider name and model info
- [ ] Current selection is clearly indicated

## Dependencies

- Existing Deepgram integration (`src/hooks/use-voice-dictation.ts`, `src/lib/deepgram.ts`)
- shadcn/ui DropdownMenu component (already installed)
- Web Audio API (browser built-in, for PCM conversion)

## Environment Variables

```env
DEEPGRAM_API_KEY=xxx      # Existing, required
ELEVENLABS_API_KEY=xxx    # New, optional (enables ElevenLabs provider)
```

## Provider Comparison

| Feature | Deepgram Nova-3 | ElevenLabs Scribe v2 |
|---------|-----------------|----------------------|
| Latency | ~300ms | ~150ms |
| Languages | 36+ | 90+ |
| Smart formatting | Yes | Yes |
| Pricing | $0.0043/min | $0.0047/min |
| VAD | Via endpointing param | Built-in commit_strategy |
