/**
 * GET /api/stt/providers
 *
 * Returns availability status for each STT provider based on API key configuration.
 */
export async function GET() {
  const providers = {
    deepgram: {
      available: !!process.env.DEEPGRAM_API_KEY,
      name: "Deepgram",
      model: "Nova-3",
    },
    elevenlabs: {
      available: !!process.env.ELEVENLABS_API_KEY,
      name: "ElevenLabs",
      model: "Scribe v2 Realtime",
    },
  };

  return new Response(JSON.stringify(providers), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60", // Cache for 1 minute
    },
  });
}
