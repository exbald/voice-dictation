/**
 * GET /api/elevenlabs/token
 *
 * Generates a single-use token for client-side WebSocket connection.
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

  // Generate a single-use token from ElevenLabs
  // This token can be used in the WebSocket URL's token query parameter
  // Token expires after 15 minutes
  let singleUseToken: string;
  try {
    const tokenResponse = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("ElevenLabs token generation failed:", errorData);
      return new Response(
        JSON.stringify({
          error: "Failed to generate ElevenLabs token",
          details: errorData,
        }),
        {
          status: tokenResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const tokenData = await tokenResponse.json();
    singleUseToken = tokenData.token;
  } catch (error) {
    console.error("ElevenLabs token request failed:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to connect to ElevenLabs",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const params = new URLSearchParams({
    model_id: "scribe_v2_realtime",
    token: singleUseToken,
    commit_strategy: "vad",
    audio_format: "pcm_16000",
    vad_silence_threshold_secs: "1.5",
    vad_threshold: "0.4",
  });

  const websocketUrl = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params.toString()}`;

  return new Response(
    JSON.stringify({
      websocketUrl,
      token: singleUseToken,
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
