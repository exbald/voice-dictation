# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vox is a push-to-talk transcription app. Hold Ctrl to record, release to copy clean transcript automatically. Supports three STT providers (Deepgram Nova-3, ElevenLabs Scribe v2, Mistral Voxtral Realtime) via WebSocket streaming.

## Commands

```bash
npm run dev          # Start dev server (DON'T run this yourself - ask user)
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run build        # Build for production
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema changes directly
npm run db:studio    # Open Drizzle Studio (DB GUI)
```

**Always run after changes:** `npm run lint && npm run typecheck`

## Architecture

### Voice Dictation Flow

```
User holds Ctrl → useVoiceDictation hook → Provider fetches credentials
                                         → WebSocket streams audio to STT service
                                         → Receive interim/final transcripts
User releases Ctrl → Stop recording → Auto-copy to clipboard
                                    → POST /api/usage/session (fire-and-forget)
```

### STT Provider System

Three providers implement the `STTProvider` interface (`src/lib/stt/types.ts`):

| Provider | Audio Format | Auth Method | Proxy |
|----------|-------------|-------------|-------|
| Deepgram Nova-3 | WebM Opus (MediaRecorder) | API key in WebSocket subprotocol | Direct |
| ElevenLabs Scribe v2 | PCM 16kHz (PCMRecorder) | Token in query param | Direct |
| Mistral Voxtral Realtime | PCM 16kHz (PCMRecorder) | Bearer token in headers | Server-side WebSocket proxy (`/api/mistral/ws`) |

Mistral requires a server-side proxy because browsers cannot set `Authorization` headers on WebSocket connections. The proxy at `src/app/api/mistral/ws/route.ts` uses `next-ws` for WebSocket upgrades and bidirectionally forwards messages.

Provider factory: `src/lib/stt/index.ts` → `createProvider(type)` returns the correct implementation.

### Key Files

- `src/hooks/use-voice-dictation.ts` - Core hook: recording state, WebSocket lifecycle, keyboard events (Ctrl hold), transcript accumulation, usage tracking POST
- `src/lib/stt/` - Provider abstraction layer
  - `types.ts` - `STTProvider` interface, `STTProviderType`, `AudioRecorder` interface
  - `deepgram-provider.ts` / `elevenlabs-provider.ts` / `mistral-provider.ts`
- `src/app/api/mistral/ws/route.ts` - WebSocket proxy (UPGRADE handler) for Mistral
- `src/app/api/{deepgram,elevenlabs,mistral}/token/route.ts` - Credential endpoints (decrypt user's stored key)
- `src/app/api/settings/api-keys/route.ts` - CRUD for encrypted user API keys
- `src/app/api/usage/session/route.ts` - Records transcription sessions (provider, duration, cost)
- `src/app/api/usage/route.ts` - Usage analytics aggregation
- `src/lib/encryption.ts` - AES-256-GCM encrypt/decrypt using `BETTER_AUTH_SECRET`
- `src/lib/cost.ts` - Per-provider pricing and cost calculation
- `src/lib/deepgram.ts` - Deepgram config constants, types (`DictationStatus`, `MicPermissionStatus`)
- `src/lib/auth.ts` - BetterAuth configuration
- `src/lib/schema.ts` - Drizzle ORM schema (user, session, account, verification, userApiKey, transcriptionSession)
- `src/components/dictation/dictation-panel.tsx` - Main UI orchestrating mic button, waveform, transcript display
- `src/components/icons/provider-icons.tsx` - SVG icons for each provider + `ProviderIcon` router

### App Routes

- `/` - Main dictation page (authenticated)
- `/login`, `/register`, `/forgot-password`, `/reset-password` - Auth pages (route group `(auth)`)
- `/settings` - API key management per provider
- `/dashboard` - Usage analytics (sessions, cost, per-provider breakdown)
- `/chat` - AI chat feature
- `/profile` - User profile

### State Machine

`DictationStatus`: `idle` → `recording` → `processing` → `copied` → `idle`

`MicPermissionStatus`: `prompt` | `granted` | `denied` | `unsupported`

### Database Schema

Tables in `src/lib/schema.ts`:
- **BetterAuth tables** (text IDs): `user`, `session`, `account`, `verification`
- **App tables** (UUID IDs): `userApiKey` (encrypted provider keys per user), `transcriptionSession` (usage tracking with provider, duration, cost)

The `provider` column is `text` type accepting any string — no migration needed when adding providers.

## Tech Stack

- **Framework**: Next.js 16 (Turbopack), React 19, TypeScript
- **Speech-to-Text**: Deepgram, ElevenLabs, Mistral (WebSocket streaming)
- **WebSocket**: `next-ws` for server-side WebSocket proxy routes
- **UI**: shadcn/ui + Tailwind CSS 4
- **Auth**: BetterAuth (Google OAuth + email/password)
- **Database**: PostgreSQL + Drizzle ORM
- **Multi-tenant**: Users store their own encrypted API keys

## Environment Variables

```env
# Required
POSTGRES_URL=postgresql://...               # Database connection
BETTER_AUTH_SECRET=32_char_random_string    # Auth secret (32+ chars), also used for API key encryption

# Optional: Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

STT provider API keys (Deepgram, ElevenLabs, Mistral) are user-provided through the Settings page, not server environment variables.

## Guidelines

- Use `npm` (not pnpm) for running commands
- Voice dictation requires authentication — users provide their own API keys
- User API keys are encrypted with AES-256-GCM, key derived from `BETTER_AUTH_SECRET` via scrypt
- Provider selection persists to localStorage, available via header dropdown
- Usage tracking: `use-voice-dictation.ts` POSTs session duration to `/api/usage/session` on stop
- To add a new STT provider:
  1. Create `src/lib/stt/{provider}-provider.ts` implementing `STTProvider` interface
  2. Add token endpoint at `src/app/api/{provider}/token/route.ts`
  3. Update factory in `src/lib/stt/index.ts`
  4. Add to `src/app/api/stt/providers/route.ts` availability check
  5. Add pricing to `src/lib/cost.ts` `PROVIDER_COSTS`
  6. Add icon to `src/components/icons/provider-icons.tsx`
  7. Update dashboard colors in `src/components/dashboard/usage-summary.tsx`
  8. If provider requires header auth, add a WebSocket proxy route (see Mistral pattern)
