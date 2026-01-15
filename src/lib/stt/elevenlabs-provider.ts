/**
 * ElevenLabs STT Provider implementation.
 * Uses Scribe v2 Realtime model with PCM 16kHz audio format.
 */

import type {
  STTProvider,
  STTProviderType,
  ProviderCredentials,
  TranscriptResult,
} from "./types";

interface ElevenLabsMessage {
  message_type: string;
  text?: string;
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
      let errorMessage = "ElevenLabs is not configured. Please add ELEVENLABS_API_KEY to your environment.";
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
      token: data.token,
    };
  }

  createWebSocket(credentials: ProviderCredentials): WebSocket {
    // Token is already included in URL query params
    return new WebSocket(credentials.websocketUrl);
  }

  createMediaRecorder(
    stream: MediaStream,
    onData: (data: Blob) => void
  ): MediaRecorder {
    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        onData(e.data);
      }
    };
    return recorder;
  }

  async prepareAudioData(blob: Blob): Promise<string> {
    const pcmData = await this.convertToPCM(blob);
    return this.arrayBufferToBase64(pcmData);
  }

  sendAudio(ws: WebSocket, data: string | Blob): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          message_type: "input_audio_chunk",
          audio_base_64: data,
          commit: false,
          sample_rate: 16000,
        })
      );
    }
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

      return null;
    } catch {
      // Ignore non-JSON messages
      return null;
    }
  }

  private async convertToPCM(blob: Blob): Promise<ArrayBuffer> {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const pcmData = new Int16Array(channelData.length);

      for (let i = 0; i < channelData.length; i++) {
        // Convert float32 [-1, 1] to int16 [-32768, 32767]
        const sample = channelData[i] ?? 0;
        pcmData[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32768)));
      }

      return pcmData.buffer;
    } finally {
      await audioContext.close();
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i] ?? 0);
    }
    return btoa(binary);
  }
}
