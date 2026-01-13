"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  DictationStatus,
  MicPermissionStatus,
  isTranscriptResult,
  extractTranscript,
} from "@/lib/deepgram";

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

interface DeepgramTokenResponse {
  apiKey: string;
  websocketUrl: string;
}

export function useVoiceDictation(): UseVoiceDictationReturn {
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const isRecordingRef = useRef(false);
  const stopRecordingRef = useRef<() => void>(() => {});

  // Check if browser supports required APIs and current permission state
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus("unsupported");
      setError("Your browser does not support microphone access");
      return;
    }

    // Check actual permission state using Permissions API
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((result) => {
        if (result.state === "granted") {
          setPermissionStatus("granted");
        }
        // Don't auto-set "denied" - let user try clicking the button first
        // since sometimes the browser will still prompt
      })
      .catch(() => {
        // Permissions API not supported, will check on first use
      });
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

  // Fetch Deepgram token from our API
  const fetchToken = async (): Promise<DeepgramTokenResponse | null> => {
    try {
      const response = await fetch("/api/deepgram/token");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch Deepgram token");
      }
      return response.json();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      return null;
    }
  };

  // Cleanup function - defined first since others depend on it
  const cleanup = useCallback(() => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current?.state !== "inactive") {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        // Ignore errors during cleanup
      }
    }
    mediaRecorderRef.current = null;

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

    // Cleanup recording resources
    cleanup();

    // Small delay to ensure final transcripts arrive
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Copy to clipboard
    setFinalTranscript((currentTranscript) => {
      const textToCopy = currentTranscript.trim();

      if (textToCopy) {
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

      return currentTranscript;
    });
  }, [cleanup]);

  // Keep ref updated for use in WebSocket callbacks
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    if (permissionStatus === "unsupported" || permissionStatus === "denied") {
      setError("Microphone access not available");
      return;
    }

    setError(null);
    setStatus("recording");
    isRecordingRef.current = true;

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

      // Fetch Deepgram token
      const tokenData = await fetchToken();
      if (!tokenData) {
        throw new Error("Could not get Deepgram credentials");
      }

      // Connect to Deepgram WebSocket
      const ws = new WebSocket(tokenData.websocketUrl, [
        "token",
        tokenData.apiKey,
      ]);
      websocketRef.current = ws;

      ws.onopen = () => {
        // Start MediaRecorder once WebSocket is open
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        mediaRecorder.start(250); // Send chunks every 250ms
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (isTranscriptResult(data)) {
            const transcript = extractTranscript(data);

            if (data.is_final) {
              // Final result - append to accumulated transcript
              if (transcript) {
                setFinalTranscript((prev) =>
                  prev ? `${prev} ${transcript}` : transcript
                );
              }
              setInterimTranscript("");
            } else {
              // Interim result - show as preview
              setInterimTranscript(transcript);
            }
          }
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection error");
        stopRecordingRef.current();
      };

      ws.onclose = () => {
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
  }, [permissionStatus, cleanup]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setFinalTranscript("");
    setInterimTranscript("");
    setError(null);
    setStatus("idle");
  }, []);

  // Keyboard event handlers
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger on Ctrl key (not Cmd on Mac for this use case)
      if (e.key === "Control") {
        setIsCtrlHeld(true);
        if (!isRecordingRef.current) {
          e.preventDefault();
          startRecording();
        }
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
  }, [startRecording]);

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
