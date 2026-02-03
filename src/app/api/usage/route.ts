import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transcriptionSession } from "@/lib/schema";

/**
 * GET /api/usage
 *
 * Returns usage statistics for the authenticated user.
 * Includes total stats, per-provider breakdown, and monthly history.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get overall summary
  const summaryRows = await db
    .select({
      totalDurationMs: sql<number>`COALESCE(SUM(${transcriptionSession.durationMs}), 0)::int`,
      totalCostUsd: sql<string>`COALESCE(SUM(${transcriptionSession.costUsd}), 0)::numeric(10,6)`,
      sessionCount: sql<number>`COUNT(*)::int`,
    })
    .from(transcriptionSession)
    .where(eq(transcriptionSession.userId, userId));

  const summary = summaryRows[0] ?? {
    totalDurationMs: 0,
    totalCostUsd: "0.000000",
    sessionCount: 0,
  };

  // Get per-provider breakdown
  const byProviderRows = await db
    .select({
      provider: transcriptionSession.provider,
      durationMs: sql<number>`COALESCE(SUM(${transcriptionSession.durationMs}), 0)::int`,
      costUsd: sql<string>`COALESCE(SUM(${transcriptionSession.costUsd}), 0)::numeric(10,6)`,
      sessions: sql<number>`COUNT(*)::int`,
    })
    .from(transcriptionSession)
    .where(eq(transcriptionSession.userId, userId))
    .groupBy(transcriptionSession.provider);

  const byProvider: Record<
    string,
    { durationMs: number; costUsd: string; sessions: number }
  > = {};
  for (const row of byProviderRows) {
    byProvider[row.provider] = {
      durationMs: row.durationMs,
      costUsd: row.costUsd,
      sessions: row.sessions,
    };
  }

  // Get monthly breakdown (last 12 months)
  const monthly = await db
    .select({
      month: sql<string>`TO_CHAR(${transcriptionSession.createdAt}, 'YYYY-MM')`,
      durationMs: sql<number>`COALESCE(SUM(${transcriptionSession.durationMs}), 0)::int`,
      costUsd: sql<string>`COALESCE(SUM(${transcriptionSession.costUsd}), 0)::numeric(10,6)`,
    })
    .from(transcriptionSession)
    .where(eq(transcriptionSession.userId, userId))
    .groupBy(sql`TO_CHAR(${transcriptionSession.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${transcriptionSession.createdAt}, 'YYYY-MM') DESC`)
    .limit(12);

  return Response.json({
    summary: {
      totalDurationMs: summary.totalDurationMs,
      totalCostUsd: summary.totalCostUsd,
      sessionCount: summary.sessionCount,
    },
    byProvider,
    monthly,
  });
}
