import { headers } from "next/headers";
import { getUserApiKey } from "@/app/api/settings/api-keys/route";
import { auth } from "@/lib/auth";

/**
 * GET /api/elevenlabs/token
 *
 * Generates a single-use token for client-side WebSocket connection.
 * Uses Scribe v2 Realtime model with VAD-based commit strategy.
 * Requires authentication - uses user's stored API key.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getUserApiKey(session.user.id, "elevenlabs");

  if (!apiKey) {
    return Response.json(
      {
        error: "No ElevenLabs API key configured",
        code: "NO_API_KEY",
        message: "Add your ElevenLabs API key in Settings",
      },
      { status: 400 }
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
      console.error("ElevenLabs token generation failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
      });

      // Provide specific error messages based on status
      let errorMessage = "Failed to generate ElevenLabs token";
      if (tokenResponse.status === 401) {
        errorMessage = "Invalid ElevenLabs API key. Please check your key in Settings.";
      } else if (tokenResponse.status === 403) {
        errorMessage = "ElevenLabs API key does not have permission for real-time transcription.";
      } else if (tokenResponse.status === 429) {
        errorMessage = "ElevenLabs rate limit exceeded. Please try again later.";
      }

      return Response.json(
        {
          error: errorMessage,
          status: tokenResponse.status,
          details: errorData,
        },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    singleUseToken = tokenData.token;
  } catch (error) {
    console.error("ElevenLabs token request failed:", error);
    return Response.json(
      { error: "Failed to connect to ElevenLabs" },
      { status: 500 }
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

  return Response.json(
    {
      websocketUrl,
      token: singleUseToken,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
