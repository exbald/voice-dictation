/**
 * Mistral STT Provider implementation.
 * Uses Voxtral Realtime model with PCM 16kHz audio format.
 * Captures raw PCM using AudioWorklet for proper streaming.
 */

import { PCMRecorder } from "./pcm-recorder";
import type {
  STTProvider,
  STTProviderType,
  ProviderCredentials,
  TranscriptResult,
  AudioRecorder,
} from "./types";

interface MistralMessage {
  type: string;
  text?: string;
  error?: { message?: string };
}

export class MistralProvider implements STTProvider {
  readonly type: STTProviderType = "mistral";

  /** Accumulated delta text for the current segment. */
  private currentSegment = "";

  async fetchCredentials(): Promise<ProviderCredentials> {
    let response: Response;
    try {
      response = await fetch("/api/mistral/token");
    } catch {
      throw new Error(
        "Unable to connect to speech service. Please check your internet connection."
      );
    }

    if (!response.ok) {
      let errorMessage =
        "Mistral is not configured. Please add your Mistral API key in Settings.";
      try {
        const data = await response.json();
        if (data.error) {
          errorMessage = data.error;
        }
      } catch {
        // Ignore parse errors
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      websocketUrl: data.websocketUrl,
    };
  }

  createWebSocket(credentials: ProviderCredentials): WebSocket {
    // Connect to local proxy — session cookies handle auth
    return new WebSocket(credentials.websocketUrl);
  }

  async createRecorder(
    stream: MediaStream,
    ws: WebSocket
  ): Promise<AudioRecorder> {
    const recorder = new PCMRecorder(stream, (samples: Int16Array) => {
      if (ws.readyState === WebSocket.OPEN) {
        const base64 = this.int16ToBase64(samples);
        ws.send(
          JSON.stringify({
            type: "input_audio.append",
            audio: base64,
          })
        );
      }
    });

    return recorder;
  }

  parseMessage(event: MessageEvent): TranscriptResult | null {
    try {
      const data: MistralMessage = JSON.parse(event.data);

      if (data.type === "transcription.text.delta") {
        // Deltas are incremental — accumulate into current segment
        this.currentSegment += data.text || "";
        return { text: this.currentSegment, isFinal: false };
      }

      if (data.type === "transcription.segment") {
        // Segment complete — return full text and reset accumulator
        const text = data.text || this.currentSegment;
        this.currentSegment = "";
        return { text, isFinal: true };
      }

      if (data.type === "transcription.done") {
        this.currentSegment = "";
        return null;
      }

      if (data.type === "error" || data.error) {
        console.error(
          "[Mistral] Error:",
          data.type,
          data.error?.message
        );
      }

      return null;
    } catch {
      // Ignore non-JSON messages
      return null;
    }
  }

  /**
   * Convert Int16Array to base64 string.
   */
  private int16ToBase64(samples: Int16Array): string {
    const bytes = new Uint8Array(samples.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  }
}
