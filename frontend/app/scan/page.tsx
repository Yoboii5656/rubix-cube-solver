"use client";
import { useState } from "react";
import Link from "next/link";
import CubeScanner from "@/components/CubeScanner";
import CubeStateDisplay from "@/components/CubeState";
import CubeSolutionPlayer from "@/components/CubeSolutionPlayer";
import { solveCube, CubeState, FACE_ORDER } from "@/lib/api";

// ─── PAGE STATES ──────────────────────────────────────────────────────────────
type PageStatus = "scanning" | "solving" | "solved" | "error";

export default function ScanPage() {
  const [cubeState, setCubeState]     = useState<Partial<CubeState>>({});
  const [currentFace, setCurrentFace] = useState(0);       // 0–5 index into FACE_ORDER
  const [status, setStatus]           = useState<PageStatus>("scanning");
  const [solution, setSolution]       = useState<any>(null);
  const [errorMsg, setErrorMsg]       = useState("");

  // Called by CubeScanner when a face is captured
  const handleFaceCaptured = async (faceKey: string, colors: string[]) => {
    const updated = { ...cubeState, [faceKey]: colors } as Partial<CubeState>;
    setCubeState(updated);

    if (currentFace < 5) {
      // More faces to scan
      setCurrentFace((i) => i + 1);
    } else {
      // All 6 faces done — send to solver
      setStatus("solving");
      try {
        const result = await solveCube(updated as CubeState);
        if (result.success) {
          setSolution(result);
          setStatus("solved");
        } else {
          setErrorMsg(result.error || "Unknown error");
          setStatus("error");
        }
      } catch (e) {
        setErrorMsg("Could not reach backend. Is FastAPI running?");
        setStatus("error");
      }
    }
  };

  // Reset everything to scan again
  const handleReset = () => {
    setCubeState({});
    setCurrentFace(0);
    setStatus("scanning");
    setSolution(null);
    setErrorMsg("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      color: "white",
      fontFamily: "Inter, sans-serif",
    }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 40px",
        borderBottom: "1px solid rgba(0,245,255,0.08)",
        background: "rgba(5,5,8,0.9)",
        backdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        {/* Back to home */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 8,
          textDecoration: "none", color: "#9ca3af",
          fontFamily: "Inter, sans-serif", fontSize: 14,
          transition: "color 0.2s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00F5FF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >
          ← Back
        </Link>

        {/* Title */}
        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 16, color: "white" }}>
          Cube<span style={{ color: "#00F5FF" }}>Solver</span>
          <span style={{ color: "#6b7280", fontWeight: 400, marginLeft: 12, fontSize: 14 }}>
            / Scanner
          </span>
        </span>

        {/* Reset button */}
        <button
          onClick={handleReset}
          style={{
            padding: "8px 20px", borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent", color: "#9ca3af",
            fontFamily: "Inter, sans-serif", fontSize: 13,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#00F5FF";
            e.currentTarget.style.color = "#00F5FF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            e.currentTarget.style.color = "#9ca3af";
          }}
        >
          ↺ Reset
        </button>
      </div>

      {/* ── FACE PROGRESS BAR ───────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "20px 40px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {FACE_ORDER.map((face, i) => {
          const isDone    = i < currentFace || status === "solved";
          const isCurrent = i === currentFace && status === "scanning";

          return (
            <div key={face} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Face pill */}
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 700, fontSize: 14,
                  // Color logic: done=green, current=cyan pulsing, pending=gray
                  background: isDone
                    ? "rgba(48,209,88,0.15)"
                    : isCurrent
                    ? "rgba(0,245,255,0.15)"
                    : "rgba(255,255,255,0.04)",
                  border: isDone
                    ? "1px solid rgba(48,209,88,0.5)"
                    : isCurrent
                    ? "1px solid #00F5FF"
                    : "1px solid rgba(255,255,255,0.08)",
                  color: isDone ? "#30D158" : isCurrent ? "#00F5FF" : "#6b7280",
                  boxShadow: isCurrent ? "0 0 12px rgba(0,245,255,0.4)" : "none",
                  transition: "all 0.3s",
                }}>
                  {isDone ? "✓" : face}
                </div>
                {/* Face label under pill */}
                <span style={{
                  fontSize: 10, fontFamily: "Inter, sans-serif",
                  color: isCurrent ? "#00F5FF" : "#4b5563",
                }}>
                  {["Top","Right","Front","Down","Left","Back"][i]}
                </span>
              </div>

              {/* Connector line between pills */}
              {i < 5 && (
                <div style={{
                  width: 24, height: 1, marginBottom: 18,
                  background: i < currentFace
                    ? "rgba(48,209,88,0.4)"
                    : "rgba(255,255,255,0.08)",
                  transition: "background 0.3s",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        // Two columns on wide screens — webcam left, cube net right
        gridTemplateColumns: "1fr 1fr",
        gap: 32,
        padding: "32px 40px",
        maxWidth: 1200,
        margin: "0 auto",
      }}>

        {/* LEFT — webcam scanner */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}>
          <div style={{
            padding: "4px 0 12px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <p style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11, letterSpacing: "0.15em",
              textTransform: "uppercase", color: "#00F5FF", marginBottom: 4,
            }}>
              Step {Math.min(currentFace + 1, 6)} of 6
            </p>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 22, color: "white", margin: 0 }}>
              {status === "scanning"
                ? `Scanning: ${["Top (U)", "Right (R)", "Front (F)", "Bottom (D)", "Left (L)", "Back (B)"][currentFace]} Face`
                : status === "solving"
                ? "Computing solution..."
                : status === "solved"
                ? "Solved! 🎉"
                : "Scan failed"}
            </h2>
          </div>

          {/* Webcam component */}
          {status === "scanning" && (
            <CubeScanner
              currentFaceIndex={currentFace}
              onCapture={handleFaceCaptured}
            />
          )}

          {/* Solving spinner */}
          {status === "solving" && (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              height: 360, gap: 20,
            }}>
              <div style={{
                width: 64, height: 64,
                border: "3px solid rgba(0,245,255,0.2)",
                borderTopColor: "#00F5FF",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "#00F5FF" }}>
                Running Kociemba algorithm...
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Solution panel */}
          {status === "solved" && solution && (
            <CubeSolutionPlayer
              moves={solution.solution}
              moveCount={solution.move_count}
              cubeState={cubeState as CubeState}
              onReset={handleReset}
            />
          )}

          {/* Error state */}
          {status === "error" && (
            <div style={{
              padding: 32, borderRadius: 16, textAlign: "center",
              background: "rgba(255,59,48,0.08)",
              border: "1px solid rgba(255,59,48,0.3)",
            }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: "#FF3B30", marginBottom: 8 }}>
                Detection Failed
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
                {errorMsg}
              </p>
              <button onClick={handleReset} style={{
                padding: "10px 28px", borderRadius: 999,
                background: "rgba(255,59,48,0.15)",
                border: "1px solid rgba(255,59,48,0.4)",
                color: "#FF3B30", fontFamily: "Inter, sans-serif",
                fontSize: 14, cursor: "pointer",
              }}>
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — cube net + instructions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Cube net */}
          <div style={{
            padding: 24, borderRadius: 20,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <p style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 11, letterSpacing: "0.15em",
              textTransform: "uppercase", color: "#6b7280",
              marginBottom: 20,
            }}>
              Cube State
            </p>
            <CubeStateDisplay
              state={cubeState}
              currentFace={status === "scanning" ? FACE_ORDER[currentFace] : undefined}
            />
          </div>

          {/* Scanning instructions card */}
          {status === "scanning" && (
            <div style={{
              padding: 24, borderRadius: 20,
              background: "rgba(0,245,255,0.03)",
              border: "1px solid rgba(0,245,255,0.12)",
            }}>
              <p style={{
                fontFamily: "Inter, sans-serif", fontWeight: 600,
                fontSize: 14, color: "#00F5FF", marginBottom: 16,
              }}>
                Tips for accurate scanning
              </p>
              {[
                "Use good, even lighting — avoid direct sunlight",
                "Hold the cube steady inside the grid lines",
                "Make sure all 9 stickers are fully visible",
                "Press SPACE or click Capture when colors look correct",
              ].map((tip, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, marginBottom: 10,
                  alignItems: "flex-start",
                }}>
                  <span style={{ color: "#00F5FF", fontSize: 12, marginTop: 2 }}>▸</span>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}