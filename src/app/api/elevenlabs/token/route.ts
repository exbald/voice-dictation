/**
 * GET /api/elevenlabs/token
 *
 * Returns ElevenLabs WebSocket URL with configuration for client-side connection.
 * Uses Scribe v2 Realtime model with VAD-based commit strategy.
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "ElevenLabs API key not configured",
        message: "Add ELEVENLABS_API_KEY to your environment variables",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const params = new URLSearchParams({
    model_id: "scribe_v2_realtime",
    token: apiKey,
    commit_strategy: "vad",
    audio_format: "pcm_16000",
    vad_silence_threshold_secs: "1.5",
    vad_threshold: "0.4",
  });

  const websocketUrl = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params.toString()}`;

  return new Response(
    JSON.stringify({
      websocketUrl,
      token: apiKey,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
