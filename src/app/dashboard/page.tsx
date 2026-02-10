"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, LayoutDashboard, Settings } from "lucide-react";
import { UserProfile } from "@/components/auth/user-profile";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { UsageSummary } from "@/components/dashboard/usage-summary";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

interface ProviderStats {
  durationMs: number;
  costUsd: string;
  sessions: number;
}

interface MonthlyData {
  month: string;
  durationMs: number;
  costUsd: string;
}

interface UsageData {
  summary: {
    totalDurationMs: number;
    totalCostUsd: string;
    sessionCount: number;
  };
  byProvider: Record<string, ProviderStats>;
  monthly: MonthlyData[];
}

export default function DashboardPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch("/api/usage");
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchUsage();
    } else {
      setLoading(false);
    }
  }, [session, fetchUsage]);

  // Loading state
  if (sessionPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  // Unauthenticated state
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-3xl font-semibold font-serif mb-2">
              Sign in required
            </h1>
            <p className="text-muted-foreground mb-6">
              Sign in to view usage, spend, and session trends.
            </p>
          </div>
          <UserProfile />
        </div>
      </div>
    );
  }

  // Authenticated state
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to home</span>
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6" />
            <div>
              <h1 className="text-3xl font-semibold font-serif">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Usage overview across providers and sessions.
              </p>
            </div>
          </div>
        </div>
        <Link href="/settings">
          <Button variant="outline" size="sm" className="rounded-full">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading usage data...
        </div>
      ) : usage ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <UsageSummary summary={usage.summary} byProvider={usage.byProvider} />
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <UsageChart monthly={usage.monthly} />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Unable to load usage data.</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={fetchUsage}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
