import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt, generateKeyHint, decrypt } from "@/lib/encryption";
import { userApiKey } from "@/lib/schema";
import { isValidProvider, type STTProviderType } from "@/lib/stt/types";

/**
 * GET /api/settings/api-keys
 *
 * List user's configured API keys (provider and hint only, not the actual key).
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await db
    .select({
      provider: userApiKey.provider,
      keyHint: userApiKey.keyHint,
      createdAt: userApiKey.createdAt,
    })
    .from(userApiKey)
    .where(eq(userApiKey.userId, session.user.id));

  return Response.json({ keys });
}

/**
 * POST /api/settings/api-keys
 *
 * Add or update an API key for a provider.
 * Body: { provider: "deepgram" | "elevenlabs", apiKey: string }
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { provider?: string; apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { provider, apiKey } = body;

  if (!provider || !isValidProvider(provider)) {
    return Response.json(
      { error: "Invalid provider. Must be 'deepgram' or 'elevenlabs'" },
      { status: 400 }
    );
  }

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    return Response.json({ error: "API key is required" }, { status: 400 });
  }

  const trimmedKey = apiKey.trim();
  const encryptedApiKey = encrypt(trimmedKey);
  const keyHint = generateKeyHint(trimmedKey);

  // Upsert: insert or update if exists for same user+provider
  await db
    .insert(userApiKey)
    .values({
      userId: session.user.id,
      provider,
      encryptedApiKey,
      keyHint,
    })
    .onConflictDoUpdate({
      target: [userApiKey.userId, userApiKey.provider],
      set: {
        encryptedApiKey,
        keyHint,
        updatedAt: new Date(),
      },
    });

  return Response.json({
    success: true,
    provider,
    keyHint,
  });
}

/**
 * DELETE /api/settings/api-keys?provider=deepgram
 *
 * Remove an API key for a provider.
 */
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");

  if (!provider || !isValidProvider(provider)) {
    return Response.json(
      { error: "Invalid provider. Must be 'deepgram' or 'elevenlabs'" },
      { status: 400 }
    );
  }

  const result = await db
    .delete(userApiKey)
    .where(
      and(
        eq(userApiKey.userId, session.user.id),
        eq(userApiKey.provider, provider)
      )
    )
    .returning({ id: userApiKey.id });

  if (result.length === 0) {
    return Response.json(
      { error: "No API key found for this provider" },
      { status: 404 }
    );
  }

  return Response.json({ success: true, provider });
}

/**
 * Internal helper to get a user's decrypted API key.
 * Used by token endpoints.
 */
export async function getUserApiKey(
  userId: string,
  provider: STTProviderType
): Promise<string | null> {
  const [key] = await db
    .select({ encryptedApiKey: userApiKey.encryptedApiKey })
    .from(userApiKey)
    .where(
      and(eq(userApiKey.userId, userId), eq(userApiKey.provider, provider))
    );

  if (!key) {
    return null;
  }

  return decrypt(key.encryptedApiKey);
}
