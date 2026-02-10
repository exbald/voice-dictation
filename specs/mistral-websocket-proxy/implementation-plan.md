# Implementation Plan: Mistral WebSocket Proxy

## Overview

Implement a server-side WebSocket proxy that allows browser clients to connect to Mistral's Voxtral Realtime API. The proxy handles Bearer token authentication that browsers cannot perform directly.

## Phase 1: WebSocket Proxy Infrastructure

Set up the WebSocket proxy endpoint in Next.js that can accept browser connections and forward to Mistral.

### Tasks

- [x] Install `ws` package for server-side WebSocket client
- [x] Create WebSocket proxy route at `src/app/api/mistral/ws/route.ts`
- [x] Implement session authentication check at proxy connection
- [x] Retrieve user's Mistral API key from database
- [x] Establish upstream connection to Mistral with Bearer token header

### Technical Details

**Package installation:**
```bash
npm install ws
npm install -D @types/ws
```

**Proxy route structure (`src/app/api/mistral/ws/route.ts`):**
```typescript
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserApiKey } from "@/app/api/settings/api-keys/route";
import WebSocket from "ws";

// Next.js 16 WebSocket upgrade handling
export async function GET(request: Request) {
  // Check for WebSocket upgrade header
  const upgradeHeader = request.headers.get("upgrade");
  if (upgradeHeader !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  // Authenticate session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get user's Mistral API key
  const apiKey = await getUserApiKey(session.user.id, "mistral");
  if (!apiKey) {
    return new Response("Mistral API key not configured", { status: 400 });
  }

  // ... WebSocket upgrade and proxy logic
}
```

**Mistral connection URL:**
```
wss://api.mistral.ai/v1/audio/transcriptions/realtime?model=voxtral-mini-transcribe-realtime-2602
```

**Mistral connection headers:**
```typescript
const mistralWs = new WebSocket(mistralUrl, {
  headers: {
    "Authorization": `Bearer ${apiKey}`,
  },
});
```

## Phase 2: Bidirectional Message Proxying

Forward messages between the browser client and Mistral's WebSocket in both directions.

### Tasks

- [x] Forward audio chunks from client to Mistral (binary → JSON with base64)
- [x] Forward transcription events from Mistral to client (passthrough)
- [x] Handle connection errors and close events on both sides
- [x] Implement proper cleanup when either connection closes

### Technical Details

**Message forwarding (client → Mistral):**
```typescript
// Client sends raw PCM audio chunks as binary
clientWs.on("message", (data) => {
  if (mistralWs.readyState === WebSocket.OPEN) {
    // Data from client is already JSON with base64 audio
    // Forward directly to Mistral
    mistralWs.send(data.toString());
  }
});
```

**Message forwarding (Mistral → client):**
```typescript
// Mistral sends JSON transcription events
mistralWs.on("message", (data) => {
  if (clientWs.readyState === WebSocket.OPEN) {
    // Forward transcription events to client
    clientWs.send(data.toString());
  }
});
```

**Error handling:**
```typescript
mistralWs.on("error", (error) => {
  console.error("[Mistral WS Proxy] Upstream error:", error.message);
  clientWs.close(1011, "Upstream connection error");
});

mistralWs.on("close", (code, reason) => {
  console.log("[Mistral WS Proxy] Upstream closed:", code, reason.toString());
  clientWs.close(code, reason.toString());
});

clientWs.on("close", () => {
  console.log("[Mistral WS Proxy] Client disconnected");
  mistralWs.close();
});
```

## Phase 3: Update Mistral Provider

Modify the existing Mistral provider to connect through the proxy instead of directly to Mistral.

### Tasks

- [x] Update `fetchCredentials()` to return proxy WebSocket URL
- [x] Update `createWebSocket()` to connect to local proxy endpoint
- [x] Remove direct Mistral URL construction from token endpoint
- [x] Update token endpoint to only verify API key exists (no URL generation)

### Technical Details

**Updated token endpoint (`src/app/api/mistral/token/route.ts`):**
```typescript
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getUserApiKey(session.user.id, "mistral");
  if (!apiKey) {
    return Response.json({
      error: "No Mistral API key configured",
      code: "NO_API_KEY",
    }, { status: 400 });
  }

  // Return proxy URL instead of direct Mistral URL
  const protocol = process.env.NODE_ENV === "production" ? "wss" : "ws";
  const host = process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";
  const websocketUrl = `${protocol}://${host}/api/mistral/ws`;

  return Response.json({ websocketUrl });
}
```

**Updated provider (`src/lib/stt/mistral-provider.ts`):**
```typescript
async fetchCredentials(): Promise<ProviderCredentials> {
  const response = await fetch("/api/mistral/token");
  if (!response.ok) {
    throw new Error("Mistral is not configured");
  }
  const data = await response.json();
  return {
    websocketUrl: data.websocketUrl,
    // No apiKey needed - proxy handles auth
  };
}

createWebSocket(credentials: ProviderCredentials): WebSocket {
  // Connect to proxy - no special auth needed (session cookies)
  return new WebSocket(credentials.websocketUrl);
}
```

## Phase 4: Testing and Verification

Verify the proxy works end-to-end with real transcription.

### Tasks

- [x] Test WebSocket connection through proxy
- [x] Verify audio streaming works correctly
- [x] Confirm transcription events are received
- [x] Test error handling (invalid API key, connection failures)
- [x] Remove debug logging added during investigation

### Technical Details

**Debug logging locations to clean up:**
- `src/hooks/use-voice-dictation.ts` lines 232-239 (echo WebSocket test)
- `src/hooks/use-voice-dictation.ts` lines 278-281 (3-second state check)

**Manual testing steps:**
1. Select Mistral as provider in dropdown
2. Ensure Mistral API key is configured in Settings
3. Hold Ctrl to start recording
4. Speak a test phrase
5. Release Ctrl - transcript should appear and copy to clipboard

**Console log verification:**
```
[STT] startRecording called
[STT] Getting microphone stream...
[STT] Got microphone stream
[STT] Fetching credentials...
[STT] Got credentials, URL: ws://localhost:3000/api/mistral/ws
[STT] Creating WebSocket...
[STT] WebSocket OPEN
```
