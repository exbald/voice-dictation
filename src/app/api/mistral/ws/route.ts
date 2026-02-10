import WsModule from "ws";
import { getUserApiKey } from "@/app/api/settings/api-keys/route";
import { auth } from "@/lib/auth";
import type { WebSocket as ServerWebSocket, RawData } from "ws";

const MISTRAL_WS_URL =
  "wss://api.mistral.ai/v1/audio/transcriptions/realtime?model=voxtral-mini-transcribe-realtime-2602";

const MAX_CONNECTIONS_PER_USER = 3;
const UPSTREAM_HANDSHAKE_TIMEOUT_MS = 10_000;

/** Track active proxy connections per user to prevent resource exhaustion. */
const activeConnections = new Map<string, number>();

/**
 * WebSocket proxy for Mistral Voxtral Realtime API.
 *
 * Browser WebSockets cannot set Authorization headers, so this proxy:
 * 1. Authenticates the user via session cookies
 * 2. Retrieves their encrypted Mistral API key
 * 3. Opens an upstream connection with Bearer token auth
 * 4. Bidirectionally forwards messages between client and Mistral
 */
/** Non-WebSocket requests get a 426 Upgrade Required response. */
export function GET() {
  return new Response("WebSocket upgrade required", { status: 426 });
}

export function UPGRADE(
  client: ServerWebSocket,
  _server: import("ws").WebSocketServer,
  request: import("next/server").NextRequest
) {
  handleUpgrade(client, request).catch((error) => {
    console.error("[Mistral WS Proxy] Unhandled error:", error);
    if (
      client.readyState === WsModule.OPEN ||
      client.readyState === WsModule.CONNECTING
    ) {
      client.close(1011, "Internal server error");
    }
  });
}

function rawDataToString(data: RawData): string {
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString();
  }
  return data.toString();
}

/** Codes that cannot be sent programmatically per RFC 6455 */
function sanitizeCloseCode(code: number): number {
  if ((code >= 1000 && code <= 1003) || (code >= 3000 && code <= 4999)) {
    return code;
  }
  return 1000;
}

function decrementConnection(userId: string) {
  const count = activeConnections.get(userId) ?? 1;
  if (count <= 1) {
    activeConnections.delete(userId);
  } else {
    activeConnections.set(userId, count - 1);
  }
}

async function handleUpgrade(
  client: ServerWebSocket,
  request: import("next/server").NextRequest
) {
  // eslint-disable-next-line no-console
  console.log("[Mistral WS Proxy] UPGRADE handler called, URL:", request.url);

  // Authenticate user session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    // eslint-disable-next-line no-console
    console.log("[Mistral WS Proxy] Auth failed — no session");
    client.close(4401, "Unauthorized");
    return;
  }

  const userId = session.user.id;

  // Enforce per-user connection limit
  const currentCount = activeConnections.get(userId) ?? 0;
  if (currentCount >= MAX_CONNECTIONS_PER_USER) {
    client.close(4429, "Too many concurrent connections");
    return;
  }
  activeConnections.set(userId, currentCount + 1);

  // Retrieve user's Mistral API key
  const apiKey = await getUserApiKey(userId, "mistral");

  if (!apiKey) {
    decrementConnection(userId);
    client.close(4400, "Mistral API key not configured");
    return;
  }

  // Connect to Mistral with Bearer token auth
  const upstream = new WsModule(MISTRAL_WS_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    handshakeTimeout: UPSTREAM_HANDSHAKE_TIMEOUT_MS,
  });

  // Buffer client messages until upstream is connected
  const pendingMessages: string[] = [];
  let upstreamReady = false;

  // Forward messages: client -> Mistral (with buffering)
  client.on("message", (data) => {
    const message = rawDataToString(data);
    if (upstreamReady && upstream.readyState === WsModule.OPEN) {
      upstream.send(message);
    } else if (upstream.readyState === WsModule.CONNECTING) {
      pendingMessages.push(message);
    }
  });

  // Forward messages: Mistral -> client
  upstream.on("message", (data) => {
    if (client.readyState === WsModule.OPEN) {
      client.send(rawDataToString(data));
    }
  });

  // Handle upstream open — flush buffered messages
  upstream.on("open", () => {
    upstreamReady = true;
    for (const msg of pendingMessages) {
      upstream.send(msg);
    }
    pendingMessages.length = 0;
  });

  // Handle upstream errors
  upstream.on("error", (error) => {
    console.error("[Mistral WS Proxy] Upstream error:", error.message);
    if (client.readyState === WsModule.OPEN) {
      client.close(1011, "Upstream connection error");
    }
  });

  // Handle upstream close -> close client
  upstream.on("close", (code, reason) => {
    decrementConnection(userId);
    if (client.readyState === WsModule.OPEN) {
      const safeCode = sanitizeCloseCode(code);
      client.close(safeCode, reason.toString().slice(0, 123));
    }
  });

  // Handle client close -> close upstream
  client.on("close", () => {
    decrementConnection(userId);
    if (
      upstream.readyState === WsModule.OPEN ||
      upstream.readyState === WsModule.CONNECTING
    ) {
      upstream.close();
    }
  });

  // Handle client errors
  client.on("error", (error) => {
    console.error("[Mistral WS Proxy] Client error:", error.message);
    if (
      upstream.readyState === WsModule.OPEN ||
      upstream.readyState === WsModule.CONNECTING
    ) {
      upstream.close();
    }
  });
}
