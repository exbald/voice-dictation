# Voice Dictation

Push-to-talk voice dictation web app. Hold Ctrl to record, release to copy clean transcript automatically.

## Features

- **Real-time transcription** - See words appear as you speak
- **Smart formatting** - Deepgram Nova-3 removes filler words ("uh", "um") and adds punctuation
- **Auto-copy** - Transcript copies to clipboard when you release Ctrl
- **Dark mode** - Supports light and dark themes

## Quick Start

```bash
# Install dependencies
npm install

# Add your Deepgram API key to .env
DEEPGRAM_API_KEY=your_key_here

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and hold Ctrl to start recording.

## How It Works

1. **Hold Ctrl** - Starts recording and streaming audio to Deepgram
2. **Speak** - See real-time transcript appear (interim text in gray, final in bold)
3. **Release Ctrl** - Recording stops, clean transcript auto-copies to clipboard
4. **Paste anywhere** - Use Cmd/Ctrl+V to paste your dictation

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Speech-to-Text**: Deepgram Nova-3 (WebSocket streaming)
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: BetterAuth (optional, dictation is public)

## Environment Variables

```env
# Required for voice dictation
DEEPGRAM_API_KEY=your_deepgram_api_key

# Database (for auth features)
POSTGRES_URL=postgresql://...

# Auth
BETTER_AUTH_SECRET=32_char_random_string
```

Get your Deepgram API key at [console.deepgram.com](https://console.deepgram.com)

## Deployment

```bash
# Deploy to Vercel
vercel

# Add DEEPGRAM_API_KEY in Vercel dashboard
```

## Project Structure

```
src/
├── app/
│   ├── api/deepgram/token/   # Token endpoint for WebSocket auth
│   └── page.tsx              # Voice dictation UI
├── components/dictation/
│   ├── dictation-panel.tsx   # Main UI container
│   ├── transcript-display.tsx # Live transcript view
│   ├── status-indicator.tsx  # Recording status
│   └── keyboard-hint.tsx     # Ctrl key instructions
├── hooks/
│   └── use-voice-dictation.ts # Core recording logic
└── lib/
    └── deepgram.ts           # Deepgram config & types
```

## License

MIT
