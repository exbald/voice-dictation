import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { calculateCost } from "@/lib/cost";
import { db } from "@/lib/db";
import { transcriptionSession } from "@/lib/schema";
import { isValidProvider } from "@/lib/stt/types";

/**
 * POST /api/usage/session
 *
 * Record a completed transcription session.
 * Body: { provider: "deepgram" | "elevenlabs" | "mistral", durationMs: number }
 *
 * Cost is calculated automatically based on provider pricing.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { provider?: string; durationMs?: number };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { provider, durationMs } = body;

  if (!provider || !isValidProvider(provider)) {
    return Response.json(
      { error: "Invalid provider. Must be 'deepgram', 'elevenlabs', or 'mistral'" },
      { status: 400 }
    );
  }

  if (typeof durationMs !== "number" || durationMs < 0) {
    return Response.json(
      { error: "durationMs must be a non-negative number" },
      { status: 400 }
    );
  }

  // Ignore very short sessions (less than 500ms) to avoid noise
  if (durationMs < 500) {
    return Response.json({
      success: true,
      skipped: true,
      reason: "Session too short",
    });
  }

  const costUsd = calculateCost(provider, durationMs);

  const insertedRows = await db
    .insert(transcriptionSession)
    .values({
      userId: session.user.id,
      provider,
      durationMs,
      costUsd: costUsd.toFixed(6),
    })
    .returning({
      id: transcriptionSession.id,
      costUsd: transcriptionSession.costUsd,
    });

  const inserted = insertedRows[0];
  if (!inserted) {
    return Response.json(
      { error: "Failed to record session" },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    sessionId: inserted.id,
    provider,
    durationMs,
    costUsd: inserted.costUsd,
  });
}
