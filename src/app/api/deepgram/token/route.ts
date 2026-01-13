import { DEEPGRAM_CONFIG } from "@/lib/deepgram";

/**
 * GET /api/deepgram/token
 *
 * Returns Deepgram API key and WebSocket configuration for client-side connection.
 * This endpoint is public (no auth required) to reduce friction for voice dictation.
 *
 * Security note: In production, consider adding rate limiting or using
 * Deepgram's temporary token generation API for enhanced security.
 */
export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "Deepgram API key not configured",
        message: "Add DEEPGRAM_API_KEY to your environment variables",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
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

  return new Response(
    JSON.stringify({
      apiKey,
      websocketUrl,
      config: DEEPGRAM_CONFIG,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Prevent caching of API key response
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
