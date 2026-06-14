import { CubeState, CubeColor, FACE_ORDER, COLOR_MAP } from "@/lib/api";

interface Props {
  state: Partial<CubeState>;
  currentFace?: string;
}

const EMPTY_FACE: CubeColor[] = Array(9).fill("?");

// Net layout — null = empty cell
const NET_LAYOUT = [
  [null, "U",  null, null],
  ["L",  "F",  "R",  "B" ],
  [null, "D",  null, null],
];

export default function CubeStateDisplay({ state, currentFace }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-mono text-xs tracking-widest uppercase text-gray-500 mb-2">
        Cube Net
      </p>
      {NET_LAYOUT.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map((face, ci) => {
            if (!face) {
              // Empty spacer cell
              return (
                <div key={ci} style={{ width: 90, height: 90 }} />
              );
            }

            const colors = (state as CubeState)?.[face as keyof CubeState] ?? EMPTY_FACE;
            const isScanned = !!state[face as keyof CubeState];
            const isCurrent = face === currentFace;

            return (
              <div
                key={ci}
                className="relative rounded-lg overflow-hidden transition-all duration-300"
                style={{
                  width: 90,
                  height: 90,
                  border: isCurrent
                    ? "2px solid #00F5FF"
                    : isScanned
                    ? "2px solid rgba(0,245,255,0.3)"
                    : "2px dashed rgba(255,255,255,0.1)",
                  boxShadow: isCurrent ? "0 0 16px rgba(0,245,255,0.5)" : "none",
                }}
              >
                {/* Face label */}
                <span
                  className="absolute top-1 left-1 font-mono text-[9px] z-10"
                  style={{ color: isCurrent ? "#00F5FF" : "#666" }}
                >
                  {face}
                </span>

                {/* 3x3 grid */}
                <div className="grid grid-cols-3 gap-[1px] p-[1px] w-full h-full">
                  {colors.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-[2px] transition-colors duration-300"
                      style={{
                        backgroundColor: COLOR_MAP[c],
                        opacity: isScanned ? 1 : 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}