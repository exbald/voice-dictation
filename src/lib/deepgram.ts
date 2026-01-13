/**
 * Deepgram configuration and types for voice dictation.
 */

/**
 * Deepgram transcription options for real-time streaming.
 */
export const DEEPGRAM_CONFIG = {
  model: "nova-3",
  language: "en",
  smart_format: true, // Removes filler words, formats numbers/currency
  punctuate: true, // Adds punctuation
  interim_results: true, // Real-time partial transcripts
  utterance_end_ms: 1000, // Silence detection
  endpointing: 300, // Endpoint detection in ms
  encoding: "linear16",
  sample_rate: 16000,
} as const;

/**
 * Build the Deepgram WebSocket URL with configuration params.
 * Note: API key is passed via WebSocket protocol header, not in URL.
 */
export function buildDeepgramUrl(): string {
  const params = new URLSearchParams({
    model: DEEPGRAM_CONFIG.model,
    language: DEEPGRAM_CONFIG.language,
    smart_format: String(DEEPGRAM_CONFIG.smart_format),
    punctuate: String(DEEPGRAM_CONFIG.punctuate),
    interim_results: String(DEEPGRAM_CONFIG.interim_results),
    utterance_end_ms: String(DEEPGRAM_CONFIG.utterance_end_ms),
    endpointing: String(DEEPGRAM_CONFIG.endpointing),
  });

  return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
}

/**
 * Deepgram transcript result from WebSocket.
 */
export interface DeepgramTranscript {
  type: "Results";
  channel_index: number[];
  duration: number;
  start: number;
  is_final: boolean;
  speech_final: boolean;
  channel: {
    alternatives: Array<{
      transcript: string;
      confidence: number;
      words: Array<{
        word: string;
        start: number;
        end: number;
        confidence: number;
        punctuated_word: string;
      }>;
    }>;
  };
}

/**
 * Deepgram metadata response.
 */
export interface DeepgramMetadata {
  type: "Metadata";
  transaction_key: string;
  request_id: string;
  sha256: string;
  created: string;
  duration: number;
  channels: number;
}

/**
 * Union type for all Deepgram WebSocket messages.
 */
export type DeepgramMessage = DeepgramTranscript | DeepgramMetadata;

/**
 * Check if a message is a transcript result.
 */
export function isTranscriptResult(
  message: DeepgramMessage
): message is DeepgramTranscript {
  return message.type === "Results";
}

/**
 * Extract transcript text from a Deepgram result.
 */
export function extractTranscript(result: DeepgramTranscript): string {
  return result.channel.alternatives[0]?.transcript || "";
}

/**
 * Voice dictation status states.
 */
export type DictationStatus =
  | "idle"
  | "recording"
  | "processing"
  | "copied"
  | "error";

/**
 * Microphone permission states.
 */
export type MicPermissionStatus =
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported";
