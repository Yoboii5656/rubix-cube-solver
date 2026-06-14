"use client";
import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// ─── CUBE FACE COLORS ─────────────────────────────────────────────────────────
// Change these hex values to adjust sticker colors
const FACE_COLORS = {
  right:  "#FF3B30", // Red   — +X face
  left:   "#FF9500", // Orange — -X face
  top:    "#FFFFFF", // White  — +Y face
  bottom: "#FFD700", // Yellow — -Y face
  front:  "#30D158", // Green  — +Z face
  back:   "#0A84FF", // Blue   — -Z face
};

// ─── SINGLE CUBIE (one small cube in the 3x3x3) ───────────────────────────────
function Cubie({
  position,
  colors,
}: {
  position: [number, number, number];
  colors: string[];
}) {
  // colors array: [right, left, top, bottom, front, back]
  return (
    <group position={position}>
      {/* The black plastic body */}
      <RoundedBox args={[0.92, 0.92, 0.92]} radius={0.08} smoothness={4}>
        <meshStandardMaterial color="#111111" />
      </RoundedBox>

      {/* Sticker on each face — slightly in front of the body */}
      {colors.map((color, i) => {
        if (!color) return null;

        // Position each sticker on the correct face
        const offsets: [number, number, number][] = [
          [0.47, 0, 0],   // right
          [-0.47, 0, 0],  // left
          [0, 0.47, 0],   // top
          [0, -0.47, 0],  // bottom
          [0, 0, 0.47],   // front
          [0, 0, -0.47],  // back
        ];

        const rotations: [number, number, number][] = [
          [0, Math.PI / 2, 0],   // right
          [0, -Math.PI / 2, 0],  // left
          [-Math.PI / 2, 0, 0],  // top
          [Math.PI / 2, 0, 0],   // bottom
          [0, 0, 0],             // front
          [0, Math.PI, 0],       // back
        ];

        return (
          <mesh key={i} position={offsets[i]} rotation={rotations[i]}>
            <planeGeometry args={[0.8, 0.8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.15} // subtle glow on stickers
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── FULL 3x3x3 CUBE ──────────────────────────────────────────────────────────
function RubiksCube() {
  const groupRef = useRef<THREE.Group>(null);

  // Slow idle Y-axis rotation speed — increase for faster spin
  const ROTATION_SPEED = 0.004;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEED;
      // Slight tilt on X so we see top face — adjust 0.4 for more/less tilt
      groupRef.current.rotation.x = 0.4;
    }
  });

  // Build all 27 cubies
  const cubies = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // Only show sticker color on outer faces, black on inner faces
        const colors = [
          x === 1  ? FACE_COLORS.right  : "",  // right
          x === -1 ? FACE_COLORS.left   : "",  // left
          y === 1  ? FACE_COLORS.top    : "",  // top
          y === -1 ? FACE_COLORS.bottom : "",  // bottom
          z === 1  ? FACE_COLORS.front  : "",  // front
          z === -1 ? FACE_COLORS.back   : "",  // back
        ];

        cubies.push(
          <Cubie
            key={`${x}${y}${z}`}
            position={[x, y, z]}  // spacing between cubies — change 1 for gaps
            colors={colors}
          />
        );
      }
    }
  }

  return <group ref={groupRef}>{cubies}</group>;
}

// ─── EXPORTED COMPONENT ───────────────────────────────────────────────────────
// containerSize: controls the canvas width/height in px — adjust for bigger/smaller cube
export default function AnimatedCube3D({ containerSize = 420 }: { containerSize?: number }) {
  return (
    <div
      className="animate-float" // uses the float keyframe from tailwind.config.ts
      style={{ width: containerSize, height: containerSize }}
    >
      <Canvas
        camera={{
          position: [4, 3, 5], // [x,y,z] camera position — move closer/farther
          fov: 45,              // field of view — lower = less perspective distortion
        }}
      >
        {/* Ambient light — base brightness of everything */}
        <ambientLight intensity={0.6} />

        {/* Main directional light — change position to shift shadows */}
        <directionalLight position={[5, 5, 5]} intensity={1.2} />

        {/* Cyan rim light for the sci-fi glow effect */}
        <pointLight position={[-5, -5, -5]} color="#00F5FF" intensity={0.8} />

        {/* The actual cube */}
        <RubiksCube />

        {/* Orbit controls — lets user drag to rotate */}
        {/* Remove this component to disable drag interaction */}
        <OrbitControls
          enableZoom={false}    // disable scroll zoom
          enablePan={false}     // disable panning
          autoRotate={false}    // we handle rotation manually above
        />
      </Canvas>

      {/* Cyan glow reflection beneath the cube — pure CSS */}
      {/* Adjust blur and opacity for stronger/weaker glow */}
      <div
        className="mx-auto rounded-full"
        style={{
          width: containerSize * 0.6,
          height: 20,
          background: "radial-gradient(ellipse, rgba(0,245,255,0.4) 0%, transparent 70%)",
          filter: "blur(8px)",
          marginTop: -20,
        }}
      />
    </div>
  );
}