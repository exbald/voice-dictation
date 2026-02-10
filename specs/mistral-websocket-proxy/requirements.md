# Requirements: Mistral WebSocket Proxy for Browser Clients

## Summary

Implement a server-side WebSocket proxy to enable browser clients to connect to Mistral's Voxtral Realtime transcription API. This is required because Mistral's API uses Bearer token authentication in HTTP headers, which browser WebSocket connections cannot set.

## Why

- **Browser limitation**: The WebSocket API in browsers cannot set custom HTTP headers like `Authorization: Bearer <token>`
- **Mistral's auth requirement**: Mistral's realtime API requires Bearer token authentication in headers (not URL query parameters)
- **Current issue**: The direct browser WebSocket connection using `api_key` query parameter fails with connection errors
- **Proven pattern**: This is the standard approach for APIs that require header-based auth from browser clients

## What

A Next.js API route that:
1. Accepts WebSocket connections from browser clients
2. Authenticates the user session
3. Retrieves the user's encrypted Mistral API key from the database
4. Opens a WebSocket connection to Mistral's API with proper Bearer token auth
5. Bidirectionally proxies audio data (client→Mistral) and transcription events (Mistral→client)

## Acceptance Criteria

- [x] Browser can establish WebSocket connection to `/api/mistral/ws` proxy endpoint
- [x] Proxy authenticates user and retrieves their stored Mistral API key
- [x] Proxy connects to Mistral's realtime API with Bearer token in headers
- [x] Audio chunks from browser are forwarded to Mistral in correct format
- [x] Transcription events from Mistral are forwarded to browser
- [x] Connection errors are properly handled and reported to client
- [x] WebSocket cleanup occurs on disconnect (both directions)
- [x] Existing Mistral provider code updated to use proxy instead of direct connection
- [x] `npm run typecheck` and `npm run lint` pass with zero errors

## Dependencies

- Existing `MistralProvider` class (`src/lib/stt/mistral-provider.ts`)
- User API key storage infrastructure (`src/lib/encryption.ts`, `getUserApiKey`)
- BetterAuth session authentication
- Next.js 16 WebSocket support (via `next-ws` or similar)

## Technical Context

### Mistral Realtime WebSocket Protocol

- **Model**: `voxtral-mini-transcribe-realtime-2602`
- **WebSocket URL**: `wss://api.mistral.ai/v1/audio/transcriptions/realtime?model=voxtral-mini-transcribe-realtime-2602`
- **Auth header**: `Authorization: Bearer <api_key>`
- **Audio format**: PCM 16-bit signed little-endian, 16kHz, mono
- **Audio send message**: `{ type: "input_audio.append", audio: "<base64>" }`
- **Server events**:
  - `session.created` — session established
  - `transcription.text.delta` — interim transcript text
  - `transcription.segment` — final transcript segment
  - `transcription.done` — stream complete
  - `error` — error occurred

### Related Features

- `specs/add-mistral-voxtral-provider/` — original Mistral provider implementation
- Current direct browser WebSocket approach fails due to auth limitations
