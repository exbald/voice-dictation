/**
 * Cost calculation and formatting utilities for STT providers.
 */

import type { STTProviderType } from "./stt/types";

/**
 * Provider pricing information (cost per minute in USD).
 * Based on current pricing as of 2024:
 * - Deepgram Nova-3: $0.0043/min (pay-as-you-go)
 * - ElevenLabs Scribe v2: $0.0067/min (API pricing)
 */
export const PROVIDER_COSTS = {
  deepgram: { costPerMinute: 0.0043, name: "Deepgram Nova-3" },
  elevenlabs: { costPerMinute: 0.0067, name: "ElevenLabs Scribe v2" },
} as const satisfies Record<
  STTProviderType,
  { costPerMinute: number; name: string }
>;

/**
 * Calculate the cost of a transcription session.
 * @param provider - The STT provider used
 * @param durationMs - Duration in milliseconds
 * @returns Cost in USD
 */
export function calculateCost(
  provider: STTProviderType,
  durationMs: number
): number {
  const minutes = durationMs / 60000;
  return minutes * PROVIDER_COSTS[provider].costPerMinute;
}

/**
 * Format a cost value for display.
 * Shows 4 decimal places for small amounts, 2 for larger ones.
 * @param costUsd - Cost in USD
 * @returns Formatted string (e.g., "$0.0012" or "$1.23")
 */
export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) {
    return `$${costUsd.toFixed(4)}`;
  }
  return `$${costUsd.toFixed(2)}`;
}

/**
 * Format a duration for display.
 * @param durationMs - Duration in milliseconds
 * @returns Formatted string (e.g., "2m 30s" or "45s")
 */
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Format minutes for display with appropriate precision.
 * @param durationMs - Duration in milliseconds
 * @returns Formatted string (e.g., "2.5 min" or "0.25 min")
 */
export function formatMinutes(durationMs: number): string {
  const minutes = durationMs / 60000;
  if (minutes < 1) {
    return `${minutes.toFixed(2)} min`;
  }
  return `${minutes.toFixed(1)} min`;
}
