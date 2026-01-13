# Plan: Voice Dictation App

**Priority:** P1
**Goal Alignment:** Streamline workflow
**Location:** `/Users/nvb/git/voice-dictation`
**Build Method:** VS Code / Cursor

## Overview

Push-to-talk voice dictation with Deepgram real-time STT. No LLM polish needed - Deepgram removes filler words automatically.

## Phase 1: Setup

**Estimated time:** 15 minutes

### Tasks

- [ ] Clone agentic-coding-starter-kit to `/Users/nvb/git/voice-dictation`
- [ ] Install dependencies (`npm install`)
- [ ] Add Deepgram SDK (`npm install @deepgram/sdk`)
- [ ] Create `.env.local` with `NEXT_PUBLIC_DEEPGRAM_API_KEY`
- [ ] Verify dev server runs (`npm run dev`)

### Commands

```bash
cd /Users/nvb/git/voice-dictation
git clone https://github.com/leonvanzyl/agentic-coding-starter-kit .
npm install
npm install @deepgram/sdk
echo "NEXT_PUBLIC_DEEPGRAM_API_KEY=your_key" > .env.local
npm run dev
```

## Phase 2: Core Features

**Estimated time:** 1-2 hours

### Tasks

- [ ] Create `app/hooks/useDeepgram.ts` - WebSocket streaming hook
  - [ ] Connect to Deepgram WebSocket
  - [ ] Stream audio chunks (250ms intervals)
  - [ ] Handle transcript responses
- [ ] Replace `app/page.tsx` with dictation UI
  - [ ] Large transcript display area
  - [ ] Pulsing recording indicator
  - [ ] Status text (Ready/Recording/Copied)
  - [ ] Push-to-talk handler (Ctrl key)
  - [ ] Auto-copy to clipboard on release

### Key Code

**Deepgram WebSocket URL:**
```typescript
const url = 'wss://api.deepgram.com/v1/listen?' +
  'model=nova-2&language=en&smart_format=true&punctuate=true';

const socket = new WebSocket(url, ['token', DEEPGRAM_API_KEY]);
```

**Push-to-talk logic:**
```typescript
// keydown Control → startStreaming()
// keyup Control → stopStreaming() + clipboard.writeText(transcript)
```

## Phase 3: Deploy

**Estimated time:** 15 minutes

### Tasks

- [ ] Push to GitHub
- [ ] Connect to Vercel
- [ ] Add environment variable in Vercel dashboard
- [ ] Test deployed app

### Commands

```bash
git add . && git commit -m "Voice dictation MVP"
git push origin main
vercel
```

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `app/hooks/useDeepgram.ts` | Deepgram WebSocket streaming |
| `app/page.tsx` | Main dictation UI |
| `.env.local` | API key |
| `.env.example` | API key placeholder |

## Verification

1. `npm run dev` → localhost:3000
2. Hold Ctrl → recording starts, live transcript appears
3. Release Ctrl → "Copied!" → paste works
4. Deploy to Vercel → test on phone/other device
