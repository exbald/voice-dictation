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

export interface STTProvider {
  readonly type: STTProviderType;
  fetchCredentials(): Promise<ProviderCredentials>;
  createWebSocket(credentials: ProviderCredentials): WebSocket;
  createMediaRecorder(
    stream: MediaStream,
    onData: (data: Blob) => void
  ): MediaRecorder;
  prepareAudioData(blob: Blob): Promise<string | Blob>;
  sendAudio(ws: WebSocket, data: string | Blob): void;
  parseMessage(event: MessageEvent): TranscriptResult | null;
}
