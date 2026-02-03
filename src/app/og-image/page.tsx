"use client";

import { Mic } from "lucide-react";

export default function OGImagePage() {
  return (
    <>
      {/* Hide Next.js dev indicators and site chrome */}
      <style>{`
        [data-nextjs-dialog-overlay],
        [data-nextjs-dialog],
        nextjs-portal,
        #__next-build-indicator,
        header,
        footer,
        nav {
          display: none !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        #main-content {
          padding: 0 !important;
          margin: 0 !important;
        }
      `}</style>

      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        }}
      >
        {/* Ambient glow effects */}
        <div
          className="absolute rounded-full blur-3xl opacity-30"
          style={{
            width: "600px",
            height: "600px",
            top: "-200px",
            right: "-100px",
            background: "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: "500px",
            height: "500px",
            bottom: "-150px",
            left: "-100px",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)",
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center text-center px-16">
          {/* Mic icon with glow */}
          <div className="relative mb-8">
            {/* Outer glow ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: "180px",
                height: "180px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%)",
              }}
            />
            {/* Icon container */}
            <div
              className="relative flex items-center justify-center rounded-full"
              style={{
                width: "140px",
                height: "140px",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                boxShadow: "0 0 80px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)",
              }}
            >
              <Mic className="w-16 h-16 text-white" strokeWidth={2} />
            </div>
          </div>

          {/* Title */}
          <h1
            className="font-semibold tracking-tight text-white mb-4"
            style={{
              fontSize: "72px",
              lineHeight: "1.1",
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            Vox
          </h1>

          {/* Tagline */}
          <p
            className="text-white/70 max-w-2xl mb-6"
            style={{
              fontSize: "28px",
              lineHeight: "1.4",
            }}
          >
            Push-to-talk transcription. Hold Ctrl to record, release to copy.
          </p>

          {/* Keyboard hint badge */}
          <div
            className="flex items-center gap-3 rounded-full px-6 py-3"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <kbd
              className="rounded px-3 py-1.5 text-white font-mono font-medium"
              style={{
                fontSize: "18px",
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              Ctrl
            </kbd>
            <span className="text-white/60" style={{ fontSize: "18px" }}>
              to record
            </span>
          </div>
        </div>

        {/* Provider badges */}
        <div
          className="absolute flex items-center gap-4"
          style={{
            bottom: "40px",
            right: "60px",
          }}
        >
          <span className="text-white/40" style={{ fontSize: "14px" }}>
            Powered by
          </span>
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-4 py-1.5 text-white/60"
              style={{
                fontSize: "14px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              Deepgram
            </span>
            <span
              className="rounded-full px-4 py-1.5 text-white/60"
              style={{
                fontSize: "14px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              ElevenLabs
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
