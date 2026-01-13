# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voice Dictation is a push-to-talk web app. Hold Ctrl to record, release to copy clean transcript automatically. Uses Deepgram Nova-3 for real-time speech-to-text via WebSocket streaming.

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
                                        → Fetch token from /api/deepgram/token
                                        → WebSocket streams audio to Deepgram
                                        → Receive interim/final transcripts
User releases Ctrl → Stop recording → Auto-copy to clipboard
```

### Key Files

- `src/hooks/use-voice-dictation.ts` - Core hook managing recording state, WebSocket connection, keyboard events, and transcript accumulation
- `src/lib/deepgram.ts` - Deepgram config (Nova-3 model), TypeScript types for WebSocket messages, helper functions
- `src/app/api/deepgram/token/route.ts` - Returns API key and WebSocket URL (public endpoint, no auth)
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
- **Speech-to-Text**: Deepgram Nova-3 (WebSocket streaming)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Auth**: BetterAuth (optional, dictation is public)
- **Database**: PostgreSQL + Drizzle ORM

## Environment Variables

```env
DEEPGRAM_API_KEY=your_deepgram_api_key  # Required for voice dictation
POSTGRES_URL=postgresql://...            # For auth features
BETTER_AUTH_SECRET=32_char_random_string # For auth features
```

## Guidelines

- Use `npm` (not pnpm) for running commands
- Voice dictation is public (no auth required for core functionality)
- Auth components exist in `src/components/auth/` but are optional
- Deepgram config in `src/lib/deepgram.ts` - model, language, smart_format settings
- WebSocket auth uses protocol header: `new WebSocket(url, ["token", apiKey])`
