"use client";

import { Clock, DollarSign, Mic, Zap } from "lucide-react";
import { ProviderIcon } from "@/components/icons/provider-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateCost,
  formatCost,
  formatDuration,
  formatMinutes,
  PROVIDER_COSTS,
} from "@/lib/cost";
import type { STTProviderType } from "@/lib/stt";

interface ProviderStats {
  durationMs: number;
  costUsd: string;
  sessions: number;
}

interface UsageSummaryProps {
  summary: {
    totalDurationMs: number;
    totalCostUsd: string;
    sessionCount: number;
  };
  byProvider: Record<string, ProviderStats>;
}

export function UsageSummary({ summary, byProvider }: UsageSummaryProps) {
  const computeCost = (
    provider: string,
    durationMs: number,
    fallbackCostUsd: string
  ) => {
    if (provider in PROVIDER_COSTS) {
      return calculateCost(provider as STTProviderType, durationMs);
    }
    const fallback = parseFloat(fallbackCostUsd);
    return Number.isFinite(fallback) ? fallback : 0;
  };

  const computedTotalCost =
    Object.entries(byProvider).reduce((total, [provider, stats]) => {
      return total + computeCost(provider, stats.durationMs, stats.costUsd);
    }, 0) || parseFloat(summary.totalCostUsd);

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMinutes(summary.totalDurationMs)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDuration(summary.totalDurationMs)} of transcription
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(computedTotalCost)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated API usage cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.sessionCount}</div>
            <p className="text-xs text-muted-foreground">
              Transcription sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Provider Breakdown */}
      {Object.keys(byProvider).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Usage by Provider
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(byProvider).map(([provider, stats]) => {
                const providerName =
                  PROVIDER_COSTS[provider as keyof typeof PROVIDER_COSTS]?.name ||
                  provider;
                const cost = computeCost(provider, stats.durationMs, stats.costUsd);

                return (
                  <div
                    key={provider}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          provider === "deepgram"
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                            : provider === "mistral"
                              ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                              : "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                        }`}
                      >
                        <ProviderIcon provider={provider} className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{providerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.sessions} sessions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatMinutes(stats.durationMs)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCost(cost)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
