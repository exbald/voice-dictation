# Vox

Push-to-talk transcription app. Hold Ctrl to record, release to copy clean transcript automatically.

## Features

- **Real-time transcription** - See words appear as you speak
- **Multi-provider support** - Choose between Deepgram Nova-3 or ElevenLabs Scribe v2
- **Smart formatting** - Auto-removes filler words ("uh", "um") and adds punctuation
- **Auto-copy** - Transcript copies to clipboard when you release Ctrl
- **Bring your own keys** - Users provide their own API keys (encrypted storage)
- **Dark mode** - Supports light and dark themes

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add POSTGRES_URL and BETTER_AUTH_SECRET

# Run database migrations
npm run db:migrate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, add your API key in Settings, then hold Ctrl to start recording.

## How It Works

1. **Hold Ctrl** - Starts recording and streaming audio to your chosen STT provider
2. **Speak** - See real-time transcript appear (interim text in gray, final in bold)
3. **Release Ctrl** - Recording stops, clean transcript auto-copies to clipboard
4. **Paste anywhere** - Use Cmd/Ctrl+V to paste your dictation

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Speech-to-Text**: Deepgram Nova-3, ElevenLabs Scribe v2 (WebSocket streaming)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Auth**: BetterAuth (Google OAuth + email/password)
- **Database**: PostgreSQL + Drizzle ORM

## Environment Variables

```env
# Required
POSTGRES_URL=postgresql://...
BETTER_AUTH_SECRET=32_char_random_string

# Optional: Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Get API keys from:
- Deepgram: [console.deepgram.com](https://console.deepgram.com)
- ElevenLabs: [elevenlabs.io](https://elevenlabs.io)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── deepgram/token/    # Deepgram WebSocket token
│   │   ├── elevenlabs/token/  # ElevenLabs WebSocket token
│   │   └── settings/api-keys/ # User API key management
│   ├── settings/              # Settings page
│   └── page.tsx               # Main dictation UI
├── components/
│   └── dictation/             # Dictation UI components
├── hooks/
│   └── use-voice-dictation.ts # Core recording logic
└── lib/
    ├── stt/                   # STT provider abstraction
    └── encryption.ts          # API key encryption
```

## License

MIT
