"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// ─── 3D cube loads client-side only ──────────────────────────────────────────
const AnimatedCube3D = dynamic(() => import("@/components/AnimatedCube3D"), {
  ssr: false,
  loading: () => (
    <div className="w-[380px] h-[380px] flex items-center justify-center">
      <div
        className="w-16 h-16 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: "#00F5FF transparent transparent transparent" }}
      />
    </div>
  ),
});

// ─── COUNT-UP ANIMATION ───────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const steps = 40;
    const duration = 1800;
    const increment = target / steps;
    const interval = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}{suffix}</span>;
}

// ─── FLOATING PARTICLES ───────────────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // 60 particles — increase for denser starfield
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      dx: (Math.random() - 0.5) * 0.25,
      dy: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.4 + 0.1,
    }));

    let animId: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,245,255,${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between", // logo LEFT, links CENTER, cta RIGHT
        padding: "16px 48px",
        background: "rgba(5,5,8,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,245,255,0.08)",
      }}
    >
      {/* LEFT — Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, width: 24, height: 24 }}>
          <div style={{ borderRadius: 2, background: "#FF3B30" }} />
          <div style={{ borderRadius: 2, background: "#0A84FF" }} />
          <div style={{ borderRadius: 2, background: "#FFD700" }} />
          <div style={{ borderRadius: 2, background: "#30D158" }} />
        </div>
        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 18, color: "white" }}>
          Cube<span style={{ color: "#00F5FF" }}>Solver</span>
        </span>
      </div>

      {/* CENTER — Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <a href="#"
          style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#9ca3af", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00F5FF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >Home</a>
        <a href="#how-it-works"
          style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#9ca3af", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00F5FF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >How It Works</a>
        <a href="#"
          style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#9ca3af", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00F5FF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >About</a>
      </div>

      {/* RIGHT — CTA button */}
      <Link
        href="/scan"
        style={{
          padding: "10px 24px",
          borderRadius: 999,
          border: "1px solid #00F5FF",
          color: "#00F5FF",
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          fontWeight: 500,
          textDecoration: "none",
          transition: "all 0.3s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#00F5FF";
          e.currentTarget.style.color = "#000";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#00F5FF";
        }}
      >
        Launch App →
      </Link>
    </nav>
  );
}

// ─── FEATURE CARD ─────────────────────────────────────────────────────────────
function FeatureCard({ title, desc, color }: {
  title: string; desc: string; color: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "32px",
        borderRadius: 20,
        background: hovered ? `rgba(${color},0.07)` : "rgba(255,255,255,0.03)",
        border: hovered ? `1px solid rgba(${color},0.4)` : "1px solid rgba(255,255,255,0.07)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered ? `0 12px 40px rgba(${color},0.12)` : "none",
        transition: "all 0.3s ease",
        cursor: "default",
      }}
    >
      <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 18, color: "white", marginBottom: 10 }}>
        {title}
      </h3>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#9ca3af", lineHeight: 1.7 }}>
        {desc}
      </p>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      <Particles />
      <Navbar />

      <main className="relative z-10">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          paddingTop: 80,
          paddingBottom: 96,
          paddingLeft: "8%",   // ← left margin, adjust for more/less indent
          paddingRight: "4%",
          gap: 0,
        }}>

          {/* LEFT COLUMN — text content */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start", // left aligned
            gap: 32,
            maxWidth: 620,
          }}>
            {/* Headline */}
            <h1 style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(40px, 5vw, 72px)",
              fontWeight: 800,
              textAlign: "left",
              lineHeight: 1.1,
              margin: 0,
            }}>
              Solve Any Cube.{" "}
              <br />
              <span style={{
                background: "linear-gradient(135deg, #00F5FF, #818cf8, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Instantly.
              </span>
            </h1>

            {/* Subheading */}
            <p style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 18, color: "#9ca3af",
              textAlign: "left", maxWidth: 480,
              lineHeight: 1.7, margin: 0,
            }}>
              Point your camera at each face. Our AI reads all 54 stickers
              and gives you the optimal solution in under a second.
            </p>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link
                href="/scan"
                style={{
                  padding: "16px 40px", borderRadius: 999,
                  background: "linear-gradient(100deg, #00F5FF, #6366f1)",
                  color: "#000", fontFamily: "Inter, sans-serif",
                  fontWeight: 700, fontSize: 16, textDecoration: "none",
                  boxShadow: "0 0 5px rgba(0,245,255,0.35)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.04)";
                  e.currentTarget.style.boxShadow = "0 0 60px rgba(0,245,255,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 0 40px rgba(0,245,255,0.35)";
                }}
              >
                Start Scanning
              </Link>

              
                <a href="#how-it-works"
                style={{
                  padding: "16px 40px", borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white", fontFamily: "Inter, sans-serif",
                  fontWeight: 500, fontSize: 16, textDecoration: "none",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                See How It Works ↓
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN — 3D cube */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* Cyan glow behind the cube */}
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}>
              {/* Radial glow blob behind cube — adjust size/opacity here */}
              <div style={{
                position: "absolute",
                width: 320, height: 320,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(0,245,255,0.12) 0%, transparent 70%)",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }} />

              {/* The 3D cube — change containerSize for bigger/smaller */}
              <AnimatedCube3D containerSize={420} />

              {/* Shadow under cube */}
              <div style={{
                width: 200, height: 16,
                background: "radial-gradient(ellipse, rgba(0,245,255,0.35) 0%, transparent 70%)",
                filter: "blur(8px)",
                marginTop: -24,
              }} />
            </div>
          </div>

        </section>
         

        {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <section id="how-it-works" style={{ padding: "100px 24px", maxWidth: 960, margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#00F5FF", marginBottom: 16 }}>
              The Process
            </p>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 40, fontWeight: 700, color: "white", margin: 0 }}>
              Three steps to solved
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {[
              {
                step: "01", title: "Scan 6 Faces",
                desc: "Hold each face of your cube up to the webcam. The HUD grid aligns automatically. Takes input of current state.",
                color: "0, 245, 255",
              },
              {
                step: "02", title: "Cube Detection",
                desc: "Computer vision reads all 54 sticker colors using HSV classification and glare correction.",
                color: "99, 102, 241",
              },
              {
                step: "03", title: "Get Solution",
                desc: "The Kociemba Brute-force and Graph Algorithms computes the optimal solution in under 20 moves. Learn to solve.",
                color: "48, 209, 88",
              },
            ].map((item) => (
              <div key={item.step} style={{ position: "relative" }}>
                {/* Ghost step number behind card */}
                <span style={{
                  position: "absolute", top: -24, left: -8,
                  fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 50,
                  color: `rgba(${item.color}, 1)`,
                  userSelect: "none", pointerEvents: "none", lineHeight: 1,
                }}>
                  {item.step}
                </span>
                <FeatureCard title={item.title} desc={item.desc} color={item.color} />
              </div>
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
        <section style={{ padding: "80px 24px" }}>
          <div style={{
            maxWidth: 680, margin: "0 auto", borderRadius: 28,
            padding: "72px 48px", textAlign: "center",
            background: "linear-gradient(135deg, rgba(0,245,255,0.06), rgba(99,102,241,0.06))",
            border: "1px solid rgba(0,245,255,0.15)",
            boxShadow: "0 0 80px rgba(0,245,255,0.04)",
          }}>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 38, fontWeight: 700, color: "white", marginBottom: 16 }}>
              Ready to solve?
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#9ca3af", marginBottom: 36, lineHeight: 1.7 }}>
              No app download. No account. Just your cube and your camera.
            </p>
            <Link
              href="/scan"
              style={{
                display: "inline-block", padding: "16px 48px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #00F5FF, #6366f1)",
                color: "#000", fontFamily: "Inter, sans-serif",
                fontWeight: 700, fontSize: 16, textDecoration: "none",
                boxShadow: "0 0 40px rgba(0,245,255,0.3)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Launch Scanner →
            </Link>
          </div>
        </section>


      </main>
    </>
  );
}