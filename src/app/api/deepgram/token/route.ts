import { headers } from "next/headers";
import { getUserApiKey } from "@/app/api/settings/api-keys/route";
import { auth } from "@/lib/auth";
import { DEEPGRAM_CONFIG } from "@/lib/deepgram";

/**
 * GET /api/deepgram/token
 *
 * Returns Deepgram API key and WebSocket configuration for client-side connection.
 * Requires authentication - uses user's stored API key.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getUserApiKey(session.user.id, "deepgram");

  if (!apiKey) {
    return Response.json(
      {
        error: "No Deepgram API key configured",
        code: "NO_API_KEY",
        message: "Add your Deepgram API key in Settings",
      },
      { status: 400 }
    );
  }

  // Build WebSocket URL with configuration params
  const params = new URLSearchParams({
    model: DEEPGRAM_CONFIG.model,
    language: DEEPGRAM_CONFIG.language,
    smart_format: String(DEEPGRAM_CONFIG.smart_format),
    punctuate: String(DEEPGRAM_CONFIG.punctuate),
    interim_results: String(DEEPGRAM_CONFIG.interim_results),
    utterance_end_ms: String(DEEPGRAM_CONFIG.utterance_end_ms),
    endpointing: String(DEEPGRAM_CONFIG.endpointing),
  });

  const websocketUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

  return Response.json(
    {
      apiKey,
      websocketUrl,
      config: DEEPGRAM_CONFIG,
    },
    {
      headers: {
        // Prevent caching of API key response
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
