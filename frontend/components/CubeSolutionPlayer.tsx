"use client";
import { useMemo, useRef, useState, useEffect, useCallback, type CSSProperties } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { COLOR_MAP, FACE_ORDER, type CubeState, type FaceKey } from "@/lib/api";

/* ════════════════════════════════════════════════════════════════════════════
   CubeSolutionPlayer
   A 3D Rubik's cube that animates the solution one move at a time.
   The user presses "Next" → the named move (U, R', F2 …) appears and the correct
   layer physically rotates on the cube. "Back" undoes a step. Drag to orbit.

   Drop-in replacement for <SolveResult> — same props { moves, moveCount, onReset }.
   ════════════════════════════════════════════════════════════════════════════ */

// ─── COLORS (match the rest of the app) ──────────────────────────────────────
const COL = {
  U: "#FFFFFF", // up    / white
  D: "#FFD700", // down  / yellow
  R: "#FF3B30", // right / red
  L: "#FF9500", // left  / orange
  F: "#30D158", // front / green
  B: "#0A84FF", // back  / blue
};
const moveColor = (m: string) => (COL as Record<string, string>)[m[0]] || "#9ca3af";

// ─── TUNABLES ────────────────────────────────────────────────────────────────
const CANVAS_SIZE   = 380;   // px — width/height of the 3D viewport
const TURN_SECONDS  = 0.28;  // how long a 90° turn takes (lower = snappier)
const AUTO_DELAY_MS = 350;   // pause between moves when auto-playing

/* ─────────────────────────────────────────────────────────────────────────────
   MOVE GEOMETRY  (validated against the backend solver)
   For a CLOCKWISE face turn: which axis to spin about, which layer (coordinate
   value -1/0/1), and the rotation direction. Suffix "'" flips dir, "2" = 180°.
   ───────────────────────────────────────────────────────────────────────────── */
const MOVE_DEF: Record<string, { axis: "x" | "y" | "z"; layer: number; dir: number }> = {
  U: { axis: "y", layer:  1, dir: -1 },
  D: { axis: "y", layer: -1, dir:  1 },
  R: { axis: "x", layer:  1, dir: -1 },
  L: { axis: "x", layer: -1, dir:  1 },
  F: { axis: "z", layer:  1, dir: -1 },
  B: { axis: "z", layer: -1, dir:  1 },
};
const AXIS_VEC = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

type Move = { axis: "x" | "y" | "z"; layer: number; dir: number; turns: number; face: string; raw: string };

function parseMove(m: string): Move {
  const def = MOVE_DEF[m[0]];
  return {
    axis: def.axis,
    layer: def.layer,
    dir: m.includes("'") ? -def.dir : def.dir,
    turns: m.includes("2") ? 2 : 1,
    face: m[0],
    raw: m,
  };
}
// Inverse of a move (flip direction; for 180° turns direction is irrelevant)
const invMove = (mv: Move): Move => ({ ...mv, dir: -mv.dir });

// ─── ONE LITTLE CUBE ─────────────────────────────────────────────────────────
type Cubie = { id: number; pos: THREE.Vector3; quat: THREE.Quaternion; colors: string[] };

/* Map each scanned facelet onto a cubie sticker so the 3D cube shows the user's
   ACTUAL cube (their colors / orientation), not a generic standard-colored one.
   - coord(face,pos) = which cubie (home position) a facelet belongs to
   - FACE_DIR_INDEX  = which sticker slot [+X,-X,+Y,-Y,+Z,-Z] faces outward
   This is the same convention the solver uses, so playing the solution forward
   from this colored state always finishes solved. */
const FACE_DIR_INDEX: Record<FaceKey, number> = { R: 0, L: 1, U: 2, D: 3, F: 4, B: 5 };

function coord(face: FaceKey, pos: number): [number, number, number] {
  const r = Math.floor(pos / 3), c = pos % 3;
  switch (face) {
    case "U": return [c - 1, 1, r - 1];
    case "R": return [1, 1 - r, 1 - c];
    case "F": return [c - 1, 1 - r, 1];
    case "D": return [c - 1, -1, 1 - r];
    case "L": return [-1, 1 - r, c - 1];
    case "B": return [1 - c, 1 - r, -1];
  }
}

function buildFromScan(cubeState: CubeState): Cubie[] {
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const colorByPos = new Map<string, string[]>();
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++)
        colorByPos.set(key(x, y, z), ["", "", "", "", "", ""]);

  FACE_ORDER.forEach((face) => {
    const stickers = cubeState[face] || [];
    for (let pos = 0; pos < 9; pos++) {
      const [x, y, z] = coord(face, pos);
      const slot = colorByPos.get(key(x, y, z))!;
      slot[FACE_DIR_INDEX[face]] = COLOR_MAP[stickers[pos] ?? "?"] ?? "#3A3A3C";
    }
  });

  const out: Cubie[] = [];
  let id = 0;
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++)
        out.push({
          id: id++,
          pos: new THREE.Vector3(x, y, z),
          quat: new THREE.Quaternion(),
          colors: colorByPos.get(key(x, y, z))!,
        });
  return out;
}

const layerOf = (c: Cubie, axis: "x" | "y" | "z") => Math.round(c.pos[axis]);

// Apply a move to the logical cube state (rotate the layer's cubies in place).
function bake(cubies: Cubie[], mv: Move): Cubie[] {
  const angle = mv.dir * mv.turns * (Math.PI / 2);
  const q = new THREE.Quaternion().setFromAxisAngle(AXIS_VEC[mv.axis], angle);
  return cubies.map((c) => {
    if (layerOf(c, mv.axis) !== mv.layer) return c;
    const pos = c.pos.clone().applyQuaternion(q);
    pos.set(Math.round(pos.x), Math.round(pos.y), Math.round(pos.z));
    return { ...c, pos, quat: q.clone().multiply(c.quat) };
  });
}

// Sticker plane placement on each cubie face (local frame)
const STICKER_OFFSET: [number, number, number][] = [
  [0.47, 0, 0], [-0.47, 0, 0], [0, 0.47, 0], [0, -0.47, 0], [0, 0, 0.47], [0, 0, -0.47],
];
const STICKER_ROT: [number, number, number][] = [
  [0, Math.PI / 2, 0], [0, -Math.PI / 2, 0], [-Math.PI / 2, 0, 0], [Math.PI / 2, 0, 0], [0, 0, 0], [0, Math.PI, 0],
];

function CubieMesh({ cubie }: { cubie: Cubie }) {
  return (
    <group position={cubie.pos} quaternion={cubie.quat}>
      <RoundedBox args={[0.92, 0.92, 0.92]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color="#0b0b0d" />
      </RoundedBox>
      {cubie.colors.map((c, i) =>
        c ? (
          <mesh key={i} position={STICKER_OFFSET[i]} rotation={STICKER_ROT[i]}>
            <planeGeometry args={[0.82, 0.82]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.12} />
          </mesh>
        ) : null
      )}
    </group>
  );
}

// ─── THE SCENE (handles the live rotation of the active layer) ─────────────────
function CubeScene({
  cubies,
  anim,
  onAnimDone,
}: {
  cubies: Cubie[];
  anim: Move | null;
  onAnimDone: () => void;
}) {
  const pivot = useRef<THREE.Group>(null);
  const progress = useRef(0);   // radians turned so far
  const fired = useRef(false);  // ensure onAnimDone fires once
  const SPEED = Math.PI / 2 / TURN_SECONDS;

  // reset whenever a new animation begins
  useEffect(() => {
    progress.current = 0;
    fired.current = false;
    pivot.current?.rotation.set(0, 0, 0);
  }, [anim]);

  useFrame((_, delta) => {
    if (!anim || !pivot.current || fired.current) return;
    const target = Math.abs(anim.dir * anim.turns * (Math.PI / 2));
    const sign = Math.sign(anim.dir * anim.turns);
    progress.current = Math.min(progress.current + SPEED * delta, target);
    const a = sign * progress.current;
    pivot.current.rotation.set(
      anim.axis === "x" ? a : 0,
      anim.axis === "y" ? a : 0,
      anim.axis === "z" ? a : 0
    );
    if (progress.current >= target) {
      fired.current = true;
      onAnimDone();
    }
  });

  const moving = anim ? cubies.filter((c) => layerOf(c, anim.axis) === anim.layer) : [];
  const still = anim ? cubies.filter((c) => layerOf(c, anim.axis) !== anim.layer) : cubies;

  return (
    <group>
      {still.map((c) => (
        <CubieMesh key={c.id} cubie={c} />
      ))}
      {anim && (
        <group ref={pivot}>
          {moving.map((c) => (
            <CubieMesh key={c.id} cubie={c} />
          ))}
        </group>
      )}
    </group>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
interface Props {
  moves: string[];
  moveCount: number;
  cubeState: CubeState;   // the actual scanned cube, so the 3D start matches reality
  onReset: () => void;
}

export default function CubeSolutionPlayer({ moves, moveCount, cubeState, onReset }: Props) {
  const parsed = useMemo(() => moves.map(parseMove), [moves]);

  // Start from the user's real scanned cube; playing the solution forward solves it.
  const initial = useMemo(() => buildFromScan(cubeState), [cubeState]);

  const [cubies, setCubies] = useState<Cubie[]>(initial);
  const [applied, setApplied] = useState(0);     // how many solution moves are done
  const [anim, setAnim] = useState<Move | null>(null);
  const [auto, setAuto] = useState(false);
  const pending = useRef<{ mv: Move; delta: number } | null>(null);

  // reset if a new solution arrives
  useEffect(() => {
    setCubies(initial);
    setApplied(0);
    setAnim(null);
    setAuto(false);
  }, [initial]);

  const busy = anim !== null;
  const atEnd = applied >= parsed.length;
  const atStart = applied <= 0;

  const next = useCallback(() => {
    if (busy || applied >= parsed.length) return;
    const mv = parsed[applied];
    pending.current = { mv, delta: +1 };
    setAnim(mv);
  }, [busy, applied, parsed]);

  const prev = useCallback(() => {
    if (busy || applied <= 0) return;
    const mv = invMove(parsed[applied - 1]);
    pending.current = { mv, delta: -1 };
    setAnim(mv);
  }, [busy, applied, parsed]);

  const restart = useCallback(() => {
    if (busy) return;
    setCubies(initial);
    setApplied(0);
    setAuto(false);
  }, [busy, initial]);

  const onAnimDone = useCallback(() => {
    const rec = pending.current;
    if (!rec) return;
    setCubies((prevC) => bake(prevC, rec.mv));
    setApplied((c) => c + rec.delta);
    pending.current = null;
    setAnim(null);
  }, []);

  // auto-play
  useEffect(() => {
    if (!auto || busy) return;
    if (applied >= parsed.length) {
      setAuto(false);
      return;
    }
    const t = setTimeout(next, AUTO_DELAY_MS);
    return () => clearTimeout(t);
  }, [auto, busy, applied, parsed.length, next]);

  // keyboard arrows
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev]);

  const upcoming = !atEnd ? moves[applied] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── 3D CUBE ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          borderRadius: 20,
          background: "radial-gradient(circle at 50% 30%, rgba(0,245,255,0.06), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.07)",
          overflow: "hidden",
        }}
      >
        <div style={{ width: "100%", height: CANVAS_SIZE }}>
          <Canvas camera={{ position: [4.2, 4, 6], fov: 42 }}>
            <ambientLight intensity={0.65} />
            <directionalLight position={[6, 8, 5]} intensity={1.2} />
            <pointLight position={[-6, -4, -6]} color="#00F5FF" intensity={0.7} />
            <CubeScene cubies={cubies} anim={anim} onAnimDone={onAnimDone} />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>

        {/* current move badge, top-left overlay */}
        <div style={{ position: "absolute", top: 14, left: 14, pointerEvents: "none" }}>
          <p style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.15em",
            textTransform: "uppercase", color: "#6b7280", margin: "0 0 4px",
          }}>
            {atEnd ? "Done" : `Next move · ${applied + 1} of ${moveCount}`}
          </p>
          {atEnd ? (
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 22, color: "#30D158" }}>
              ✓ Solved
            </span>
          ) : (
            <span style={{
              fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 34,
              color: moveColor(upcoming!), textShadow: `0 0 18px ${moveColor(upcoming!)}66`,
            }}>
              {upcoming}
            </span>
          )}
        </div>

        {/* drag hint, bottom-right */}
        <p style={{
          position: "absolute", bottom: 10, right: 14, margin: 0, pointerEvents: "none",
          fontFamily: "Inter, sans-serif", fontSize: 11, color: "#4b5563",
        }}>
          drag to rotate
        </p>
      </div>

      {/* ── CONTROLS ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={prev}
          disabled={busy || atStart}
          style={ctrlBtn(busy || atStart)}
        >
          ← Back
        </button>

        <button
          onClick={() => setAuto((a) => !a)}
          disabled={atEnd}
          style={{
            ...ctrlBtn(atEnd),
            color: auto ? "#00F5FF" : "#9ca3af",
            borderColor: auto ? "#00F5FF" : "rgba(255,255,255,0.1)",
          }}
        >
          {auto ? "❚❚ Pause" : "▶ Auto"}
        </button>

        <button
          onClick={atEnd ? restart : next}
          disabled={busy && !atEnd}
          style={{
            flex: 1, padding: "12px 20px", borderRadius: 10, border: "none",
            background: busy && !atEnd ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #00F5FF, #6366f1)",
            color: busy && !atEnd ? "#6b7280" : "#000",
            fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14,
            cursor: busy && !atEnd ? "default" : "pointer", transition: "all 0.2s",
          }}
        >
          {atEnd ? "↺ Replay from start" : "Next →"}
        </button>
      </div>

      {/* ── MOVE SEQUENCE PILLS ─────────────────────────────────────────────── */}
      <div style={{
        padding: 16, borderRadius: 16,
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#6b7280", letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
            Move Sequence
          </p>
          <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#30D158", margin: 0 }}>
            {moveCount} moves
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {moves.map((m, i) => {
            const isNext = i === applied;
            const isDone = i < applied;
            const c = moveColor(m);
            return (
              <div key={i} style={{
                padding: "6px 12px", borderRadius: 8,
                fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 14,
                background: isNext ? `${c}22` : "rgba(255,255,255,0.04)",
                border: isNext ? `1px solid ${c}` : "1px solid rgba(255,255,255,0.08)",
                color: isNext ? c : isDone ? "#4b5563" : "#e5e7eb",
                boxShadow: isNext ? `0 0 12px ${c}44` : "none",
                opacity: isDone ? 0.55 : 1, transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 9, color: isNext ? c : "#6b7280", marginRight: 4 }}>{i + 1}.</span>
                {m}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ACTIONS ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => navigator.clipboard.writeText(moves.join(" "))}
          style={{
            flex: 1, padding: 12, borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#9ca3af",
            fontFamily: "Inter, sans-serif", fontSize: 14, cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00F5FF"; e.currentTarget.style.color = "#00F5FF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#9ca3af"; }}
        >
          📋 Copy Moves
        </button>
        <button
          onClick={onReset}
          style={{
            flex: 1, padding: 12, borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #00F5FF, #6366f1)", color: "#000",
            fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}
        >
          ↺ Scan Again
        </button>
      </div>
    </div>
  );
}

// small helper for the secondary control buttons
function ctrlBtn(disabled: boolean): CSSProperties {
  return {
    padding: "12px 18px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
    color: disabled ? "#4b5563" : "#9ca3af",
    fontFamily: "Inter, sans-serif", fontSize: 14,
    cursor: disabled ? "default" : "pointer", transition: "all 0.2s",
  };
}