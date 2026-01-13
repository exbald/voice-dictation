# Voice Dictation App (Wispr-like)

**Created:** 2026-01-13
**Priority:** P1
**Status:** Not Started
**Location:** `/Users/nvb/git/voice-dictation`

## What

Push-to-talk voice dictation web app. Hold Ctrl to record, release to auto-copy clean transcript. Real-time streaming via Deepgram (auto-removes filler words).

## Why

Native macOS/Chromebook dictation gives raw output. This app uses Deepgram which auto-removes filler words ("uh", "um"), adds punctuation, and formats smartly - like Wispr Flow but self-hosted.

**Supports Goal:** "Streamline workflow - better systems and processes"

## Success Criteria

- [ ] Hold Ctrl to record, release to stop
- [ ] Real-time transcript appears while speaking
- [ ] Filler words (uh, um) auto-removed by Deepgram
- [ ] Clean text auto-copies to clipboard on release
- [ ] Deployed on Vercel

## Dependencies

- Deepgram account (existing)
- Vercel account

## Resources

- [agentic-coding-starter-kit](https://github.com/leonvanzyl/agentic-coding-starter-kit) - Base template
- [Deepgram WebSocket API](https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio)
- Build spec: `~/.claude/plans/replicated-frolicking-lark.md`
