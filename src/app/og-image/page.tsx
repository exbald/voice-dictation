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
          background:
            "linear-gradient(180deg, #f9f6f1 0%, #f3efe7 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(168, 95, 58, 0.12) 0%, transparent 55%), radial-gradient(circle at 80% 20%, rgba(78, 118, 168, 0.1) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 2px)",
          }}
        />

        <div
          className="absolute rounded-full blur-3xl opacity-30"
          style={{
            width: "520px",
            height: "520px",
            top: "-180px",
            right: "-120px",
            background:
              "radial-gradient(circle, rgba(168, 95, 58, 0.2) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex h-full w-full flex-col justify-between px-20 py-16">
          <div className="flex items-start justify-between">
            <div>
              <p
                className="uppercase tracking-[0.5em] text-[#6b6257]"
                style={{ fontSize: "12px" }}
              >
                Editorial dictation studio
              </p>
              <h1
                className="font-serif text-[#1d1a16]"
                style={{ fontSize: "72px", lineHeight: "1.05" }}
              >
                Vox
              </h1>
              <p
                className="text-[#3f3a33] max-w-xl"
                style={{ fontSize: "26px", lineHeight: "1.4" }}
              >
                Capture the voice behind the words. Hold Ctrl to record, release
                to copy.
              </p>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full border"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  borderColor: "rgba(78,118,168,0.25)",
                  boxShadow: "0 24px 60px -40px rgba(0,0,0,0.35)",
                }}
              >
                <Mic className="h-10 w-10 text-[#4e76a8]" strokeWidth={1.6} />
              </div>
              <div
                className="rounded-full px-5 py-2 text-[#3f3a33]"
                style={{
                  fontSize: "14px",
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "rgba(255,255,255,0.75)",
                }}
              >
                Ctrl to record
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[#6b6257]">
            <span style={{ fontSize: "14px" }}>vox</span>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: "14px" }}>Powered by</span>
              <span
                className="rounded-full px-3 py-1"
                style={{
                  fontSize: "13px",
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "rgba(255,255,255,0.75)",
                }}
              >
                Deepgram
              </span>
              <span
                className="rounded-full px-3 py-1"
                style={{
                  fontSize: "13px",
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "rgba(255,255,255,0.75)",
                }}
              >
                ElevenLabs
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
