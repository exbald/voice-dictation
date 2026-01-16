/**
 * STT Provider factory and utilities.
 */

import { DeepgramProvider } from "./deepgram-provider";
import { ElevenLabsProvider } from "./elevenlabs-provider";
import type { STTProviderType, STTProvider } from "./types";

export * from "./types";

const STORAGE_KEY = "stt-provider";

export function createProvider(type: STTProviderType): STTProvider {
  switch (type) {
    case "deepgram":
      return new DeepgramProvider();
    case "elevenlabs":
      return new ElevenLabsProvider();
    default:
      return new DeepgramProvider();
  }
}

export function getSavedProvider(): STTProviderType {
  if (typeof window === "undefined") return "deepgram";
  return (localStorage.getItem(STORAGE_KEY) as STTProviderType) || "deepgram";
}

export function saveProvider(type: STTProviderType): void {
  localStorage.setItem(STORAGE_KEY, type);
}
