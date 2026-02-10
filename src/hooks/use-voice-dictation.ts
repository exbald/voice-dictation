"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { DictationStatus, MicPermissionStatus } from "@/lib/deepgram";
import { createProvider, STTProviderType, STTProvider, AudioRecorder } from "@/lib/stt";

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
  providerType: STTProviderType = "deepgram"
): UseVoiceDictationReturn {
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

  // Update provider when type changes
  useEffect(() => {
    providerRef.current = createProvider(providerType);
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
    console.log("[STT] startRecording called");

    // Quick test: can ANY WebSocket connect?
    const testWs = new WebSocket("wss://echo.websocket.org");
    testWs.onopen = () => console.log("[TEST] Echo WebSocket CONNECTED - WebSockets work!");
    testWs.onerror = () => console.error("[TEST] Echo WebSocket FAILED - WebSockets are blocked!");
    setTimeout(() => {
      console.log("[TEST] Echo WebSocket state after 2s:", testWs.readyState, ["CONNECTING","OPEN","CLOSING","CLOSED"][testWs.readyState]);
      testWs.close();
    }, 2000);
    if (isRecordingRef.current) return;
    if (permissionStatus === "unsupported" || permissionStatus === "denied") {
      setError("Microphone access not available");
      return;
    }

    setError(null);
    setStatus("recording");
    isRecordingRef.current = true;

    const provider = providerRef.current;

    try {
      // Get microphone stream
      console.log("[STT] Getting microphone stream...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      console.log("[STT] Got microphone stream");
      mediaStreamRef.current = stream;
      setMediaStream(stream);
      setPermissionStatus("granted");

      // Fetch credentials from provider
      console.log("[STT] Fetching credentials...");
      const credentials = await provider.fetchCredentials();
      console.log("[STT] Got credentials, URL:", credentials.websocketUrl?.substring(0, 50));

      // Create WebSocket using provider
      console.log("[STT] Creating WebSocket...");
      const ws = provider.createWebSocket(credentials);
      console.log("[STT] WebSocket created, readyState:", ws.readyState);
      websocketRef.current = ws;

      // Debug: check state after 3 seconds
      setTimeout(() => {
        console.log("[STT] WebSocket state after 3s:", ws.readyState, ["CONNECTING","OPEN","CLOSING","CLOSED"][ws.readyState]);
      }, 3000);

      ws.onopen = async () => {
        console.log("[STT] WebSocket OPEN");
        try {
          // Create recorder using provider (handles audio capture and sending)
          const recorder = await provider.createRecorder(stream, ws);
          recorderRef.current = recorder;
          // Start recording (async for PCMRecorder, sync for MediaRecorder)
          await recorder.start(250); // timeslice for MediaRecorder
        } catch (err) {
          const error = err as Error;
          setError(error.message);
          stopRecordingRef.current();
        }
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
        console.error("[STT] WebSocket ERROR:", e);
        setError("WebSocket connection error");
        stopRecordingRef.current();
      };

      ws.onclose = (e) => {
        console.log("[STT] WebSocket CLOSED:", e.code, e.reason);
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
