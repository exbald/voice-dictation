import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userApiKey } from "@/lib/schema";

/**
 * GET /api/stt/providers
 *
 * Returns availability status for each STT provider.
 * - available: true (provider is supported)
 * - hasKey: boolean (user has configured an API key for this provider)
 *
 * Requires authentication.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's configured API keys
  const userKeys = await db
    .select({ provider: userApiKey.provider })
    .from(userApiKey)
    .where(eq(userApiKey.userId, session.user.id));

  const configuredProviders = new Set(userKeys.map((k) => k.provider));

  const providers = {
    deepgram: {
      available: true,
      hasKey: configuredProviders.has("deepgram"),
      name: "Deepgram",
      model: "Nova-3",
    },
    elevenlabs: {
      available: true,
      hasKey: configuredProviders.has("elevenlabs"),
      name: "ElevenLabs",
      model: "Scribe v2 Realtime",
    },
  };

  return Response.json(providers, {
    headers: {
      // Short cache since keys can change
      "Cache-Control": "private, max-age=10",
    },
  });
}
