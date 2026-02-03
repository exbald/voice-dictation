# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vox is a push-to-talk transcription app. Hold Ctrl to record, release to copy clean transcript automatically. Supports multiple STT providers (Deepgram Nova-3 and ElevenLabs Scribe v2) via WebSocket streaming.

## Commands

```bash
npm run dev          # Start dev server (DON'T run this yourself - ask user)
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run build        # Build for production
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema changes directly
```

**Always run after changes:** `npm run lint && npm run typecheck`

## Architecture

### Voice Dictation Flow

```
User holds Ctrl → useVoiceDictation hook → MediaRecorder captures audio
                                        → Provider fetches credentials
                                        → WebSocket streams audio to STT service
                                        → Receive interim/final transcripts
User releases Ctrl → Stop recording → Auto-copy to clipboard
```

### Key Files

- `src/hooks/use-voice-dictation.ts` - Core hook managing recording state, WebSocket connection, keyboard events, and transcript accumulation
- `src/lib/stt/` - Provider abstraction layer for multiple STT services
  - `types.ts` - `STTProvider` interface and common types
  - `index.ts` - Factory function `createProvider()` and localStorage helpers
  - `deepgram-provider.ts` - Deepgram Nova-3 implementation
  - `elevenlabs-provider.ts` - ElevenLabs Scribe v2 implementation (PCM conversion)
- `src/contexts/stt-provider-context.tsx` - React context for provider selection
- `src/components/ui/provider-toggle.tsx` - Dropdown to switch providers
- `src/app/api/deepgram/token/route.ts` - Deepgram credentials endpoint (uses user's stored key)
- `src/app/api/elevenlabs/token/route.ts` - ElevenLabs credentials endpoint (uses user's stored key)
- `src/app/api/stt/providers/route.ts` - Provider availability check
- `src/app/api/settings/api-keys/route.ts` - CRUD for user API keys
- `src/app/api/usage/route.ts` - Usage statistics and analytics
- `src/lib/encryption.ts` - AES-256-GCM encryption for API keys
- `src/lib/cost.ts` - Provider pricing and cost calculation
- `src/components/dictation/dictation-panel.tsx` - Main UI orchestrating mic button, waveform, transcript display

### Dictation Components

| Component | Purpose |
|-----------|---------|
| `mic-button.tsx` | Hero button with recording state animations (glow, pulse, scale) |
| `waveform-visualizer.tsx` | Circular audio visualizer using Web Audio API |
| `transcript-display.tsx` | Shows final (solid) and interim (faded) text |
| `keyboard-hint.tsx` | Ctrl key instruction with state-aware styling |
| `status-indicator.tsx` | Recording/processing/copied status dot |

### State Machine

`DictationStatus`: `idle` → `recording` → `processing` → `copied` → `idle`

`MicPermissionStatus`: `prompt` | `granted` | `denied` | `unsupported`

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Speech-to-Text**: Multi-provider support
  - Deepgram Nova-3 (WebSocket streaming, WebM Opus)
  - ElevenLabs Scribe v2 Realtime (WebSocket streaming, PCM 16kHz)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Auth**: BetterAuth (Google OAuth + email/password)
- **Database**: PostgreSQL + Drizzle ORM
- **Multi-tenant**: Users store their own encrypted API keys

## Environment Variables

```env
# Required for multi-tenant SaaS
POSTGRES_URL=postgresql://...               # Database connection
BETTER_AUTH_SECRET=32_char_random_string    # Auth secret (32+ chars)

# Optional: Google OAuth
GOOGLE_CLIENT_ID=...                        # For Google sign-in
GOOGLE_CLIENT_SECRET=...
```

**Note:** STT provider API keys (Deepgram, ElevenLabs) are user-provided through the Settings page, not server environment variables.

## Guidelines

- Use `npm` (not pnpm) for running commands
- Voice dictation requires authentication - users provide their own API keys
- User API keys are encrypted with AES-256-GCM using `BETTER_AUTH_SECRET`
- Provider selection persists to localStorage, available via header dropdown
- To add a new STT provider:
  1. Create `src/lib/stt/{provider}-provider.ts` implementing `STTProvider` interface
  2. Add token endpoint at `src/app/api/{provider}/token/route.ts`
  3. Update factory in `src/lib/stt/index.ts`
  4. Add to `src/app/api/stt/providers/route.ts` availability check
