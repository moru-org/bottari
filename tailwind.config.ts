import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        bottari: {
          yellow: "#FFDF00",
          orange: "#FF6B35",
          coral: "#FF4E50",
          dark: "#1A1A24",
          surface: "#242434",
          border: "#323248",
          mint: "#2EC4B6",
        }
      },
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "sans-serif"],
      },
      animation: {
        "bounce-short": "bounce 0.5s ease-in-out 2",
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "scale-up": "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleUp: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
