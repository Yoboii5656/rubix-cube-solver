"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { scanFace, CubeColor, COLOR_MAP } from "@/lib/api";

interface Props {
  currentFaceIndex: number;
  onCapture: (faceKey: string, colors: string[]) => void;
}

const FACE_KEYS = ["U", "R", "F", "D", "L", "B"];

// ─── GRID DIMENSIONS ──────────────────────────────────────────────────────────
// Change GRID_SIZE to make the scanning grid bigger/smaller
const GRID_SIZE = 180;
const CELL_SIZE = GRID_SIZE / 3;

export default function CubeScanner({ currentFaceIndex, onCapture }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  const [preview,    setPreview]    = useState<CubeColor[]>(Array(9).fill("?"));
  const [capturing,  setCapturing]  = useState(false);
  const [camError,   setCamError]   = useState("");
  const [flash,      setFlash]      = useState(false); // capture flash effect

  // ─── START WEBCAM ───────────────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => setCamError("Camera access denied. Please allow camera permissions."));

    return () => {
      // Stop webcam when component unmounts
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ─── CAPTURE FRAME AND SEND TO BACKEND ─────────────────────────────────────
  const captureFrame = useCallback(async (): Promise<CubeColor[] | null> => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    // Draw current video frame onto hidden canvas
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(null);
        try {
          const colors = await scanFace(blob);
          resolve(colors);
        } catch {
          // Backend not running — return mock colors for UI testing
          resolve(Array(9).fill("W") as CubeColor[]);
        }
      }, "image/jpeg", 0.85);
    });
  }, []);

  // ─── LIVE PREVIEW — scan every 400ms ───────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const colors = await captureFrame();
      if (colors) setPreview(colors);
    }, 400); // ← increase for less frequent updates, decrease for snappier preview

    return () => clearInterval(interval);
  }, [captureFrame]);

  // ─── HANDLE CAPTURE BUTTON / SPACE KEY ─────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (capturing) return;
    setCapturing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 200); // flash lasts 200ms

    const colors = await captureFrame();
    if (colors) {
      onCapture(FACE_KEYS[currentFaceIndex], colors);
    }
    setCapturing(false);
  }, [capturing, captureFrame, currentFaceIndex, onCapture]);

  // Space bar shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleCapture();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCapture]);

  // ─── CAMERA ERROR STATE ─────────────────────────────────────────────────────
  if (camError) {
    return (
      <div style={{
        height: 360, borderRadius: 16,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
        background: "rgba(255,59,48,0.06)",
        border: "1px solid rgba(255,59,48,0.2)",
      }}>
        <span style={{ fontSize: 32 }}>📷</span>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#FF3B30", textAlign: "center", maxWidth: 280 }}>
          {camError}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── WEBCAM + HUD OVERLAY ─────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        // Cyan glowing border around webcam
        border: "1px solid rgba(0,245,255,0.25)",
        boxShadow: "0 0 24px rgba(0,245,255,0.1)",
        background: "#0a0a0f",
        aspectRatio: "4/3",
      }}>
        {/* Live video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* Capture flash overlay — white flash on capture */}
        {flash && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(255,255,255,0.25)",
            pointerEvents: "none",
            zIndex: 10,
          }} />
        )}

        {/* ── HUD GRID OVERLAY ─────────────────────────────────────────────── */}
        {/* Centered 3x3 grid with color preview cells */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: GRID_SIZE,
          height: GRID_SIZE,
          zIndex: 5,
        }}>
          {/* 9 cells */}
          {preview.map((color, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: col * CELL_SIZE,
                  top:  row * CELL_SIZE,
                  width:  CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                  // Semi-transparent color fill matching detected color
                  background: color !== "?"
                    ? `${COLOR_MAP[color]}55`  // 55 = ~33% opacity
                    : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  transition: "background 0.3s",
                }}
              />
            );
          })}

          {/* Corner brackets — the HUD reticle effect */}
          {/* Top-left */}
          <div style={{ position: "absolute", top: 0, left: 0, width: 16, height: 16,
            borderTop: "2px solid #00F5FF", borderLeft: "2px solid #00F5FF" }} />
          {/* Top-right */}
          <div style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16,
            borderTop: "2px solid #00F5FF", borderRight: "2px solid #00F5FF" }} />
          {/* Bottom-left */}
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 16, height: 16,
            borderBottom: "2px solid #00F5FF", borderLeft: "2px solid #00F5FF" }} />
          {/* Bottom-right */}
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16,
            borderBottom: "2px solid #00F5FF", borderRight: "2px solid #00F5FF" }} />
        </div>

        {/* Scanline sweep animation */}
        <div style={{
          position: "absolute",
          // Covers only the grid area
          top: "calc(50% - 90px)",
          left: "calc(50% - 90px)",
          width: GRID_SIZE,
          height: 2,
          background: "linear-gradient(90deg, transparent, #00F5FF, transparent)",
          opacity: 0.6,
          animation: "scanline 2s linear infinite",
          zIndex: 6,
          pointerEvents: "none",
        }} />

        {/* Scanline keyframe — injected inline */}
        <style>{`
          @keyframes scanline {
            0%   { transform: translateY(0px); }
            100% { transform: translateY(${GRID_SIZE}px); }
          }
        `}</style>

        {/* Face label on video */}
        <div style={{
          position: "absolute", bottom: 12, left: 12,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11, color: "#00F5FF",
          background: "rgba(0,0,0,0.6)",
          padding: "4px 10px", borderRadius: 6,
          letterSpacing: "0.1em",
        }}>
          FACE {currentFaceIndex + 1}/6 · {FACE_KEYS[currentFaceIndex]}
        </div>
      </div>

      {/* Hidden canvas used for frame capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ── LIVE COLOR SWATCHES ───────────────────────────────────────────────── */}
      {/* Shows the 9 detected colors as a mini preview strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10, color: "#6b7280",
          textTransform: "uppercase", letterSpacing: "0.1em",
          whiteSpace: "nowrap",
        }}>
          Live detection
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {preview.map((color, i) => (
            <div
              key={i}
              style={{
                width: 24, height: 24, borderRadius: 4,
                background: COLOR_MAP[color],
                border: "1px solid rgba(255,255,255,0.15)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── CAPTURE BUTTON ───────────────────────────────────────────────────── */}
      <button
        onClick={handleCapture}
        disabled={capturing}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: 12,
          border: "none",
          background: capturing
            ? "rgba(0,245,255,0.1)"
            : "linear-gradient(135deg, #00F5FF, #6366f1)",
          color: capturing ? "#6b7280" : "#000",
          fontFamily: "Inter, sans-serif",
          fontWeight: 700, fontSize: 15,
          cursor: capturing ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          boxShadow: capturing ? "none" : "0 0 24px rgba(0,245,255,0.3)",
        }}
        onMouseEnter={(e) => {
          if (!capturing) e.currentTarget.style.transform = "scale(1.01)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {capturing ? "Capturing..." : "⬡ Capture Face"}
      </button>

      {/* Keyboard shortcut hint */}
      <p style={{
        textAlign: "center",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 11, color: "#4b5563",
      }}>
        or press <kbd style={{
          padding: "2px 8px", borderRadius: 4,
          border: "1px solid #374151",
          background: "rgba(255,255,255,0.05)",
          color: "#9ca3af", fontSize: 11,
        }}>SPACE</kbd>
      </p>
    </div>
  );
}