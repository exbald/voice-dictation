/**
 * STT Provider types and interfaces.
 * Common abstraction for speech-to-text providers (Deepgram, ElevenLabs, etc.)
 */

export type STTProviderType = "deepgram" | "elevenlabs";

/** List of all valid provider types for runtime validation */
export const VALID_PROVIDERS: STTProviderType[] = ["deepgram", "elevenlabs"];

/** Type guard to check if a string is a valid provider type */
export function isValidProvider(provider: string): provider is STTProviderType {
  return VALID_PROVIDERS.includes(provider as STTProviderType);
}

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
}

export interface ProviderCredentials {
  websocketUrl: string;
  apiKey?: string; // Deepgram uses in subprotocol
  token?: string; // ElevenLabs uses in query param
}

/**
 * Generic audio recorder interface.
 * Satisfied by both MediaRecorder and PCMRecorder.
 */
export interface AudioRecorder {
  readonly state: string;
  start(timeslice?: number): void | Promise<void>;
  stop(): void;
}

/**
 * Function to send audio data. Accepts Blob (Deepgram) or string (ElevenLabs JSON).
 */
export type AudioSendFunction = (data: Blob | string) => void;

export interface STTProvider {
  readonly type: STTProviderType;
  fetchCredentials(): Promise<ProviderCredentials>;
  createWebSocket(credentials: ProviderCredentials): WebSocket;
  /**
   * Create a recorder that sends audio data via the provided send function.
   * This allows the caller to buffer audio before the WebSocket is connected.
   */
  createRecorder(
    stream: MediaStream,
    sendData: AudioSendFunction
  ): Promise<AudioRecorder>;
  parseMessage(event: MessageEvent): TranscriptResult | null;
}
