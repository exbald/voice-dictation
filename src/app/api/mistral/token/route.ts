import { headers } from "next/headers";
import { getUserApiKey } from "@/app/api/settings/api-keys/route";
import { auth } from "@/lib/auth";

/**
 * GET /api/mistral/token
 *
 * Returns Mistral API key and WebSocket URL for client-side connection.
 * Uses Voxtral Mini realtime transcription model.
 * Requires authentication - uses user's stored API key.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getUserApiKey(session.user.id, "mistral");

  if (!apiKey) {
    return Response.json(
      {
        error: "No Mistral API key configured",
        code: "NO_API_KEY",
        message: "Add your Mistral API key in Settings",
      },
      { status: 400 }
    );
  }

  // Build WebSocket URL with model and API key params
  const params = new URLSearchParams({
    model: "voxtral-mini-transcribe-realtime-2602",
    api_key: apiKey,
  });

  const websocketUrl = `wss://api.mistral.ai/v1/audio/transcriptions/realtime?${params.toString()}`;

  return Response.json(
    {
      apiKey,
      websocketUrl,
    },
    {
      headers: {
        // Prevent caching of API key response
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
