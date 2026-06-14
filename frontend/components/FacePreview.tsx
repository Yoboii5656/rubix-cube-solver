import { CubeColor, COLOR_MAP } from "@/lib/api";

interface Props {
  colors: CubeColor[];
  size?: number; // cell size in px, default 28
}

export default function FacePreview({ colors, size = 28 }: Props) {
  return (
    <div
      className="grid grid-cols-3 gap-[2px] p-[2px] rounded-md"
      style={{ width: size * 3 + 8, height: size * 3 + 8 }}
    >
      {colors.map((c, i) => (
        <div
          key={i}
          className="rounded-sm transition-colors duration-300"
          style={{
            backgroundColor: COLOR_MAP[c],
            width: size,
            height: size,
            boxShadow: c !== "?" ? `0 0 6px ${COLOR_MAP[c]}66` : "none",
          }}
        />
      ))}
    </div>
  );
}