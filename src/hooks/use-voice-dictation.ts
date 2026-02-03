"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { DictationStatus, MicPermissionStatus } from "@/lib/deepgram";
import { createProvider, STTProviderType, STTProvider, AudioRecorder } from "@/lib/stt";

interface UseVoiceDictationOptions {
  /** Called when authentication is required before recording */
  onAuthRequired?: (() => void) | undefined;
  /** Called when no API key is configured for the provider */
  onKeyRequired?: ((provider: STTProviderType) => void) | undefined;
}

interface UseVoiceDictationReturn {
  // State
  status: DictationStatus;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  isCtrlHeld: boolean;

  // Microphone permission
  permissionStatus: MicPermissionStatus;
  requestPermission: () => Promise<void>;

  // Media stream for visualizer
  mediaStream: MediaStream | null;

  // Manual controls
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscript: () => void;
}

export function useVoiceDictation(
  providerType: STTProviderType = "deepgram",
  options: UseVoiceDictationOptions = {}
): UseVoiceDictationReturn {
  const { onAuthRequired, onKeyRequired } = options;
  // State
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<MicPermissionStatus>("prompt");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isCtrlHeld, setIsCtrlHeld] = useState(false);

  // Refs for cleanup and to avoid stale closures
  const providerRef = useRef<STTProvider>(createProvider(providerType));
  const recorderRef = useRef<AudioRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const isRecordingRef = useRef(false);
  const stopRecordingRef = useRef<() => void>(() => {});
  const interimTranscriptRef = useRef<string>("");
  const finalTranscriptRef = useRef<string>("");
  const recordingStartTimeRef = useRef<number>(0);
  const providerTypeRef = useRef<STTProviderType>(providerType);

  // Update provider when type changes
  useEffect(() => {
    providerRef.current = createProvider(providerType);
    providerTypeRef.current = providerType;
  }, [providerType]);

  // Check if browser supports required APIs and current permission state
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Use async IIFE to avoid synchronous setState in effect body
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermissionStatus("unsupported");
        setError("Your browser does not support microphone access");
        return;
      }

      // Check actual permission state using Permissions API
      try {
        const result = await navigator.permissions?.query({
          name: "microphone" as PermissionName,
        });
        if (result?.state === "granted") {
          setPermissionStatus("granted");
        }
        // Don't auto-set "denied" - let user try clicking the button first
        // since sometimes the browser will still prompt
      } catch {
        // Permissions API not supported, will check on first use
      }
    })();
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    if (permissionStatus === "unsupported") return;

    try {
      // Try simple request first (like Google AI Studio)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the test stream immediately
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus("granted");
      setError(null);
    } catch (err) {
      const error = err as Error;
      console.error("Microphone permission error:", error.name, error.message);

      // Try fallback with minimal constraints (like Google's approach)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        stream.getTracks().forEach((track) => track.stop());
        setPermissionStatus("granted");
        setError(null);
        return;
      } catch {
        // Fallback also failed, use original error
      }

      if (error.name === "NotAllowedError") {
        setPermissionStatus("denied");
        setError(
          "Microphone access denied. Please enable it in your browser settings."
        );
      } else if (error.name === "NotFoundError") {
        setPermissionStatus("unsupported");
        setError("No microphone found. Please connect a microphone.");
      } else {
        // Show the actual error for debugging
        setError(`Microphone error: ${error.name} - ${error.message}`);
      }
    }
  }, [permissionStatus]);

  // Cleanup function - defined first since others depend on it
  const cleanup = useCallback(() => {
    // Stop recorder
    if (recorderRef.current?.state !== "inactive") {
      try {
        recorderRef.current?.stop();
      } catch {
        // Ignore errors during cleanup
      }
    }
    recorderRef.current = null;

    // Stop media stream tracks
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setMediaStream(null);

    // Close WebSocket
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.close();
    }
    websocketRef.current = null;
  }, []);

  // Stop recording and copy to clipboard
  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) return;

    isRecordingRef.current = false;
    setStatus("processing");

    // Calculate session duration
    const durationMs = recordingStartTimeRef.current > 0
      ? Date.now() - recordingStartTimeRef.current
      : 0;

    // Stop recorder first (stops sending audio)
    if (recorderRef.current?.state !== "inactive") {
      try {
        recorderRef.current?.stop();
      } catch {
        // Ignore errors
      }
    }
    recorderRef.current = null;

    // Stop media stream tracks
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setMediaStream(null);

    // Wait for final transcripts to arrive (WebSocket still open)
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Now close WebSocket
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.close();
    }
    websocketRef.current = null;

    // Record usage session (fire and forget, don't block on response)
    if (durationMs > 0) {
      fetch("/api/usage/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerTypeRef.current,
          durationMs,
        }),
      }).catch(() => {
        // Ignore errors - usage tracking is non-critical
      });
    }

    // Copy to clipboard - combine final transcript with any remaining interim transcript
    // This handles providers like ElevenLabs that may not have committed the final segment yet
    const final = finalTranscriptRef.current.trim();
    const interim = interimTranscriptRef.current.trim();
    const textToCopy = final && interim
      ? `${final} ${interim}`
      : final || interim;

    if (textToCopy) {
      // Update the displayed final transcript to include interim
      if (interim) {
        setFinalTranscript(textToCopy);
        finalTranscriptRef.current = textToCopy;
      }
      setInterimTranscript("");
      interimTranscriptRef.current = "";

      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          setStatus("copied");
          toast.success("Copied to clipboard!");
          // Reset to idle after showing "copied" state
          setTimeout(() => setStatus("idle"), 2000);
        })
        .catch(() => {
          setError("Could not copy to clipboard");
          toast.error("Failed to copy to clipboard");
          setStatus("error");
        });
    } else {
      toast.info("No transcript to copy");
      setStatus("idle");
    }
  }, []);

  // Keep ref updated for use in WebSocket callbacks
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    console.log("[STT] startRecording called", {
      isRecording: isRecordingRef.current,
      permissionStatus,
      hasOnAuthRequired: !!onAuthRequired,
      hasOnKeyRequired: !!onKeyRequired
    });

    if (isRecordingRef.current) return;
    if (permissionStatus === "unsupported" || permissionStatus === "denied") {
      setError("Microphone access not available");
      return;
    }

    // Check if auth is required (callback provided means user is not authenticated)
    if (onAuthRequired) {
      console.log("[STT] Auth required, showing sign-in");
      onAuthRequired();
      return;
    }

    setError(null);
    setStatus("recording");
    isRecordingRef.current = true;
    recordingStartTimeRef.current = Date.now();

    const provider = providerRef.current;

    // Audio buffer for chunks captured before WebSocket is ready
    const audioBuffer: Array<Blob | string> = [];
    let wsReady = false;
    let wsRef: WebSocket | null = null;

    // Send function that buffers or sends depending on WebSocket state
    const sendData = (data: Blob | string) => {
      if (wsReady && wsRef?.readyState === WebSocket.OPEN) {
        wsRef.send(data);
      } else {
        // Buffer until WebSocket is ready
        audioBuffer.push(data);
      }
    };

    // Flush buffered audio to WebSocket
    const flushBuffer = () => {
      for (const chunk of audioBuffer) {
        if (wsRef?.readyState === WebSocket.OPEN) {
          wsRef.send(chunk);
        }
      }
      audioBuffer.length = 0; // Clear buffer
      wsReady = true;
    };

    try {
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      mediaStreamRef.current = stream;
      setMediaStream(stream);
      setPermissionStatus("granted");

      // Start recording IMMEDIATELY to capture audio while connecting
      // Audio will be buffered until WebSocket is ready
      const recorder = await provider.createRecorder(stream, sendData);
      recorderRef.current = recorder;
      await recorder.start(250); // timeslice for MediaRecorder

      // Fetch credentials from provider (in parallel with audio capture)
      let credentials;
      try {
        console.log("[STT] Fetching credentials...");
        credentials = await provider.fetchCredentials();
        console.log("[STT] Credentials received:", {
          hasWebsocketUrl: !!credentials.websocketUrl,
          hasApiKey: !!credentials.apiKey,
          hasToken: !!credentials.token,
          urlPrefix: credentials.websocketUrl?.substring(0, 40),
        });
      } catch (credError) {
        const error = credError as Error & { code?: string };
        // Check if this is a "no API key" error
        if (error.code === "NO_API_KEY" || error.message.includes("No API key")) {
          if (onKeyRequired) {
            onKeyRequired(providerTypeRef.current);
            // Clean up
            recorder.stop();
            stream.getTracks().forEach((track) => track.stop());
            isRecordingRef.current = false;
            setStatus("idle");
            setMediaStream(null);
            recorderRef.current = null;
            return;
          }
        }
        throw credError;
      }

      // Create WebSocket using provider
      console.log("[STT] Creating WebSocket with URL:", credentials.websocketUrl);
      let ws: WebSocket;
      try {
        ws = provider.createWebSocket(credentials);
        console.log("[STT] WebSocket created, readyState:", ws.readyState);
      } catch (wsError) {
        console.error("[STT] WebSocket creation failed:", wsError);
        throw wsError;
      }
      websocketRef.current = ws;
      wsRef = ws;

      // Debug: Check WebSocket state after 3 seconds
      setTimeout(() => {
        console.log("[STT] WebSocket state after 3s:", {
          readyState: ws.readyState,
          readyStateText: ["CONNECTING", "OPEN", "CLOSING", "CLOSED"][ws.readyState],
          url: ws.url?.substring(0, 50) + "...",
        });
      }, 3000);

      ws.onopen = () => {
        console.log("[STT] WebSocket connected, readyState:", ws.readyState);
        // WebSocket is ready - flush buffered audio and start live streaming
        flushBuffer();
      };

      ws.onmessage = (event) => {
        const result = provider.parseMessage(event);
        if (result) {
          if (result.isFinal) {
            // Final result - append to accumulated transcript
            if (result.text) {
              setFinalTranscript((prev) => {
                const newTranscript = prev ? `${prev} ${result.text}` : result.text;
                finalTranscriptRef.current = newTranscript;
                return newTranscript;
              });
            }
            setInterimTranscript("");
            interimTranscriptRef.current = "";
          } else {
            // Interim result - show as preview
            setInterimTranscript(result.text);
            interimTranscriptRef.current = result.text;
          }
        }
      };

      ws.onerror = (e) => {
        console.error("[STT] WebSocket error:", e);
        console.error("[STT] WebSocket error - readyState:", ws.readyState, "url:", ws.url);
        setError("WebSocket connection error");
        stopRecordingRef.current();
      };

      ws.onclose = (e) => {
        console.log("[STT] WebSocket closed:", e.code, e.reason, "wasClean:", e.wasClean);
        // Connection closed, ensure we're in a valid state
        if (isRecordingRef.current) {
          stopRecordingRef.current();
        }
      };
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setStatus("error");
      isRecordingRef.current = false;
      cleanup();
    }
  }, [permissionStatus, cleanup, onAuthRequired, onKeyRequired]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setError(null);
    setStatus("idle");
  }, []);

  // Keyboard event handlers
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger on Ctrl key (not Cmd on Mac for this use case)
      if (e.key === "Control") {
        console.log("[STT] Ctrl pressed");
        setIsCtrlHeld(true);
        if (!isRecordingRef.current) {
          e.preventDefault();
          startRecording();
        }
      }

      // Press 'c' to clear transcript (only when not recording and not in an input)
      if (
        e.key === "c" &&
        !isRecordingRef.current &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        clearTranscript();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        setIsCtrlHeld(false);
        if (isRecordingRef.current) {
          e.preventDefault();
          stopRecordingRef.current();
        }
      }
    };

    // Also handle blur to reset ctrl state when window loses focus
    const handleBlur = () => {
      setIsCtrlHeld(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [startRecording, clearTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    interimTranscript,
    finalTranscript,
    error,
    isCtrlHeld,
    permissionStatus,
    requestPermission,
    mediaStream,
    startRecording,
    stopRecording,
    clearTranscript,
  };
}
