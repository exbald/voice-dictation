/**
 * STT Provider types and interfaces.
 * Common abstraction for speech-to-text providers (Deepgram, ElevenLabs, etc.)
 */

export type STTProviderType = "deepgram" | "elevenlabs";

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

export interface STTProvider {
  readonly type: STTProviderType;
  fetchCredentials(): Promise<ProviderCredentials>;
  createWebSocket(credentials: ProviderCredentials): WebSocket;
  createRecorder(
    stream: MediaStream,
    ws: WebSocket
  ): Promise<AudioRecorder>;
  parseMessage(event: MessageEvent): TranscriptResult | null;
}
