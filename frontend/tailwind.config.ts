import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          glow: "#00F5FF",
        },
        bg: "#050508",
      },
      fontFamily: {
        space: ["var(--font-space)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        pulse_glow: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(0,245,255,0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(0,245,255,0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        scanline: "scanline 2s linear infinite",
        pulse_glow: "pulse_glow 2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;