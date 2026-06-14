"use client";
import { useState } from "react";

interface Props {
  moves: string[];
  moveCount: number;
  onReset: () => void;
}

// ─── COLOR PER FACE MOVE ──────────────────────────────────────────────────────
// Each move letter maps to a cube face color
const MOVE_COLORS: Record<string, string> = {
  U: "#FFFFFF",  // white  — top face
  D: "#FFD700",  // yellow — bottom face
  R: "#FF3B30",  // red    — right face
  L: "#FF9500",  // orange — left face
  F: "#30D158",  // green  — front face
  B: "#0A84FF",  // blue   — back face
};

function getMoveColor(move: string): string {
  // move could be "U", "U2", "U'" — first char is the face letter
  return MOVE_COLORS[move[0]] || "#9ca3af";
}

export default function SolveResult({ moves, moveCount, onReset }: Props) {
  // Step-through: which move is currently highlighted
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const goNext = () => setActiveStep((s) => Math.min((s ?? -1) + 1, moves.length - 1));
  const goPrev = () => setActiveStep((s) => Math.max((s ?? 0) - 1, 0));

  const handleCopy = () => {
    navigator.clipboard.writeText(moves.join(" "));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "20px 24px",
        borderRadius: 16,
        background: "rgba(48,209,88,0.06)",
        border: "1px solid rgba(48,209,88,0.25)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 11, color: "#30D158",
            letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4,
          }}>
            Solution Found
          </p>
          <p style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700, fontSize: 28, color: "white", margin: 0,
          }}>
            {moveCount} <span style={{ fontSize: 16, color: "#9ca3af", fontWeight: 400 }}>moves</span>
          </p>
        </div>
        <span style={{ fontSize: 40 }}>🎉</span>
      </div>

      {/* ── MOVE BADGES ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: 20, borderRadius: 16,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <p style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10, color: "#6b7280",
          letterSpacing: "0.15em", textTransform: "uppercase",
          marginBottom: 16,
        }}>
          Move Sequence
        </p>

        {/* Wrapping flex row of move pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {moves.map((move, i) => {
            const isActive = i === activeStep;
            const isDone   = activeStep !== null && i < activeStep;
            const color    = getMoveColor(move);

            return (
              <div
                key={i}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 700, fontSize: 14,
                  // Active = full color, done = dimmed, pending = dark
                  background: isActive
                    ? `${color}22`
                    : isDone
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(255,255,255,0.05)",
                  border: isActive
                    ? `1px solid ${color}`
                    : "1px solid rgba(255,255,255,0.08)",
                  color: isActive ? color : isDone ? "#4b5563" : "#e5e7eb",
                  boxShadow: isActive ? `0 0 12px ${color}44` : "none",
                  transition: "all 0.2s",
                  cursor: "default",
                }}
              >
                {/* Step number */}
                <span style={{ fontSize: 9, color: isActive ? color : "#6b7280", marginRight: 4 }}>
                  {i + 1}.
                </span>
                {move}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── STEP THROUGH CONTROLS ─────────────────────────────────────────── */}
      <div style={{
        padding: "16px 20px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <p style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10, color: "#6b7280",
          letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12,
        }}>
          Step Through
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Prev button */}
          <button
            onClick={goPrev}
            disabled={activeStep === null || activeStep === 0}
            style={{
              padding: "10px 20px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent", color: "#9ca3af",
              fontFamily: "Inter, sans-serif", fontSize: 14,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#00F5FF")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
          >
            ← Prev
          </button>

          {/* Current step indicator */}
          <div style={{
            flex: 1, textAlign: "center",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 13, color: "#9ca3af",
          }}>
            {activeStep === null
              ? "Press Start to begin"
              : activeStep >= moves.length
              ? "✓ Complete!"
              : `Move ${activeStep + 1} of ${moveCount}: `}
            {activeStep !== null && activeStep < moves.length && (
              <span style={{
                color: getMoveColor(moves[activeStep]),
                fontWeight: 700, fontSize: 18,
              }}>
                {moves[activeStep]}
              </span>
            )}
          </div>

          {/* Next / Start button */}
          <button
            onClick={activeStep === null ? () => setActiveStep(0) : goNext}
            disabled={activeStep !== null && activeStep >= moves.length - 1}
            style={{
              padding: "10px 20px", borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #00F5FF, #6366f1)",
              color: "#000", fontFamily: "Inter, sans-serif",
              fontWeight: 600, fontSize: 14,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {activeStep === null ? "Start →" : "Next →"}
          </button>
        </div>
      </div>

      {/* ── ACTION BUTTONS ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12 }}>
        {/* Copy moves */}
        <button
          onClick={handleCopy}
          style={{
            flex: 1, padding: "12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent", color: "#9ca3af",
            fontFamily: "Inter, sans-serif", fontSize: 14,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#00F5FF";
            e.currentTarget.style.color = "#00F5FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "#9ca3af";
          }}
        >
          📋 Copy Moves
        </button>

        {/* Scan again */}
        <button
          onClick={onReset}
          style={{
            flex: 1, padding: "12px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #00F5FF, #6366f1)",
            color: "#000", fontFamily: "Inter, sans-serif",
            fontWeight: 600, fontSize: 14,
            cursor: "pointer", transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ↺ Scan Again
        </button>
      </div>

    </div>
  );
}