"use client";

import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCost, formatMinutes } from "@/lib/cost";

interface MonthlyData {
  month: string;
  durationMs: number;
  costUsd: string;
}

interface UsageChartProps {
  monthly: MonthlyData[];
}

function formatMonth(month: string): string {
  const parts = month.split("-");
  const year = parts[0] ?? "2024";
  const monthNum = parts[1] ?? "01";
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function UsageChart({ monthly }: UsageChartProps) {
  if (monthly.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Monthly Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No usage data yet</p>
            <p className="text-sm mt-1">
              Start transcribing to see your monthly usage.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by month ascending and take last 6 months
  const sortedMonthly = [...monthly]
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  // Find max duration for scaling
  const maxDuration = Math.max(...sortedMonthly.map((m) => m.durationMs));
  const barMaxWidth = 100; // percentage

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Monthly Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedMonthly.map((data) => {
            const cost = parseFloat(data.costUsd);
            const widthPercent =
              maxDuration > 0
                ? (data.durationMs / maxDuration) * barMaxWidth
                : 0;

            return (
              <div key={data.month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{formatMonth(data.month)}</span>
                  <span className="text-muted-foreground">
                    {formatMinutes(data.durationMs)} · {formatCost(cost)}
                  </span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(widthPercent, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
