"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface WaveformVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
  /** Size of the visualizer in pixels */
  size?: number;
}

export function WaveformVisualizer({
  stream,
  isRecording,
  size = 200,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isRecording) {
      // Cleanup when not recording
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
      analyserRef.current = null;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up audio context and analyser
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Handle canvas sizing
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    // Draw function - circular waveform
    const draw = () => {
      if (!analyserRef.current || !isRecording) {
        return;
      }

      animationIdRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      const centerX = size / 2;
      const centerY = size / 2;
      const innerRadius = size * 0.35; // Inside of the ring
      const maxBarHeight = size * 0.12; // Max outward extension

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Number of bars around the circle
      const numBars = 64;
      const angleStep = (Math.PI * 2) / numBars;

      for (let i = 0; i < numBars; i++) {
        const dataIndex = Math.floor((i * bufferLength) / numBars);
        const value = dataArray[dataIndex] ?? 0;
        const normalizedHeight = (value / 255) * maxBarHeight;
        const barHeight = Math.max(2, normalizedHeight);

        const angle = i * angleStep - Math.PI / 2; // Start from top

        // Calculate bar position
        const innerX = centerX + Math.cos(angle) * innerRadius;
        const innerY = centerY + Math.sin(angle) * innerRadius;
        const outerX = centerX + Math.cos(angle) * (innerRadius + barHeight);
        const outerY = centerY + Math.sin(angle) * (innerRadius + barHeight);

        // Draw bar
        const opacity = 0.4 + (value / 255) * 0.6;
        ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`; // Red color
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stream, isRecording, size]);

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300",
        isRecording ? "opacity-100" : "opacity-0"
      )}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="w-full h-full"
        style={{ maxWidth: size, maxHeight: size }}
      />
    </div>
  );
}
