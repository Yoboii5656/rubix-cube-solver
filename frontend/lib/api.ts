const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type FaceKey = "U" | "R" | "F" | "D" | "L" | "B";
export type CubeColor = "W" | "Y" | "R" | "O" | "B" | "G" | "?";
export type CubeState = Record<FaceKey, CubeColor[]>;

export const FACE_ORDER: FaceKey[] = ["U", "R", "F", "D", "L", "B"];

export const FACE_LABELS: Record<FaceKey, string> = {
  U: "Top (Up)",
  R: "Right",
  F: "Front",
  D: "Bottom (Down)",
  L: "Left",
  B: "Back",
};

export const COLOR_MAP: Record<CubeColor, string> = {
  W: "#FFFFFF",
  Y: "#FFD700",
  R: "#FF3B30",
  O: "#FF9500",
  B: "#0A84FF",
  G: "#30D158",
  "?": "#3A3A3C",
};

export async function scanFace(blob: Blob): Promise<CubeColor[]> {
  const formData = new FormData();
  formData.append("file", blob, "frame.jpg");

  const res = await fetch(`${API_BASE}/scan-face`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Scan failed");
  const data = await res.json();
  return data.colors;
}

export async function solveCube(state: CubeState) {
  const res = await fetch(`${API_BASE}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });

  if (!res.ok) throw new Error("Solve failed");
  return res.json();
}