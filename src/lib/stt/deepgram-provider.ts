/**
 * Deepgram STT Provider implementation.
 * Uses Nova-3 model with WebM Opus audio format.
 */

import type {
  STTProvider,
  STTProviderType,
  ProviderCredentials,
  TranscriptResult,
  AudioRecorder,
  AudioSendFunction,
} from "./types";

interface DeepgramTokenResponse {
  apiKey: string;
  websocketUrl: string;
}

interface DeepgramTranscript {
  type: "Results";
  is_final: boolean;
  channel: {
    alternatives: Array<{
      transcript: string;
    }>;
  };
}

function isTranscriptResult(data: unknown): data is DeepgramTranscript {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    (data as DeepgramTranscript).type === "Results"
  );
}

export class DeepgramProvider implements STTProvider {
  readonly type: STTProviderType = "deepgram";

  async fetchCredentials(): Promise<ProviderCredentials> {
    let response: Response;
    try {
      response = await fetch("/api/deepgram/token");
    } catch {
      throw new Error(
        "Unable to connect to speech service. Please check your internet connection."
      );
    }

    if (!response.ok) {
      let errorMessage =
        "Deepgram is not configured. Please add DEEPGRAM_API_KEY to your environment.";
      let errorCode: string | undefined;
      try {
        const data = await response.json();
        if (data.error) {
          errorMessage = data.error;
        }
        if (data.code) {
          errorCode = data.code;
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

    const data: DeepgramTokenResponse = await response.json();
    return {
      websocketUrl: data.websocketUrl,
      apiKey: data.apiKey,
    };
  }

  createWebSocket(credentials: ProviderCredentials): WebSocket {
    if (!credentials.apiKey) {
      throw new Error("Deepgram requires an API key");
    }
    return new WebSocket(credentials.websocketUrl, [
      "token",
      credentials.apiKey,
    ]);
  }

  async createRecorder(
    stream: MediaStream,
    sendData: AudioSendFunction
  ): Promise<AudioRecorder> {
    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        sendData(e.data);
      }
    };

    return recorder;
  }

  parseMessage(event: MessageEvent): TranscriptResult | null {
    try {
      const data = JSON.parse(event.data);

      if (isTranscriptResult(data)) {
        const transcript = data.channel.alternatives[0]?.transcript || "";
        return {
          text: transcript,
          isFinal: data.is_final,
        };
      }

      return null;
    } catch {
      // Ignore non-JSON messages
      return null;
    }
  }
}
