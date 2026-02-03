/**
 * ElevenLabs STT Provider implementation.
 * Uses Scribe v2 Realtime model with PCM 16kHz audio format.
 * Captures raw PCM using AudioWorklet for proper streaming.
 */

import { PCMRecorder } from "./pcm-recorder";
import type {
  STTProvider,
  STTProviderType,
  ProviderCredentials,
  TranscriptResult,
  AudioRecorder,
  AudioSendFunction,
} from "./types";

interface ElevenLabsMessage {
  message_type: string;
  text?: string;
  error?: string;
}

export class ElevenLabsProvider implements STTProvider {
  readonly type: STTProviderType = "elevenlabs";

  async fetchCredentials(): Promise<ProviderCredentials> {
    let response: Response;
    try {
      response = await fetch("/api/elevenlabs/token");
    } catch {
      throw new Error(
        "Unable to connect to speech service. Please check your internet connection."
      );
    }

    if (!response.ok) {
      let errorMessage = "ElevenLabs connection failed. Please check your API key in Settings.";
      let errorCode: string | undefined;
      try {
        const data = await response.json();
        if (data.error) {
          errorMessage = data.error;
        }
        if (data.code) {
          errorCode = data.code;
        }
        // Log details for debugging
        if (data.details || data.status) {
          console.error("[ElevenLabs] API error details:", data);
        }
      } catch {
        // Ignore parse errors
      }
      const error = new Error(errorMessage) as Error & { code?: string | undefined };
      if (errorCode) {
        error.code = errorCode;
      }
      throw error;
    }

    const data = await response.json();
    return {
      websocketUrl: data.websocketUrl,
      token: data.token,
    };
  }

  createWebSocket(credentials: ProviderCredentials): WebSocket {
    // Token is already included in URL query params
    return new WebSocket(credentials.websocketUrl);
  }

  async createRecorder(
    stream: MediaStream,
    sendData: AudioSendFunction
  ): Promise<AudioRecorder> {
    const recorder = new PCMRecorder(stream, (samples: Int16Array) => {
      const base64 = this.int16ToBase64(samples);
      sendData(
        JSON.stringify({
          message_type: "input_audio_chunk",
          audio_base_64: base64,
          commit: false,
          sample_rate: 16000,
        })
      );
    });

    return recorder;
  }

  parseMessage(event: MessageEvent): TranscriptResult | null {
    try {
      const data: ElevenLabsMessage = JSON.parse(event.data);

      if (data.message_type === "partial_transcript") {
        return { text: data.text || "", isFinal: false };
      }

      if (data.message_type === "committed_transcript") {
        return { text: data.text || "", isFinal: true };
      }

      // Also handle committed_transcript_with_timestamps
      if (data.message_type === "committed_transcript_with_timestamps") {
        return { text: data.text || "", isFinal: true };
      }

      // Log errors for debugging
      if (data.message_type === "error" || data.error) {
        console.error("[ElevenLabs] Error:", data.message_type, data.error);
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
