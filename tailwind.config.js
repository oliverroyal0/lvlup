/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        surface: "#12121a",
        surface2: "#1a1a26",
        border: "#2a2a3e",
        gold: "#f0c040",
        cyan: "#40d4e8",
        purple: "#9b6ff0",
        green: "#40e890",
        red: "#e84040",
        orange: "#f08040",
        muted: "#6a6a8a",
      },
      fontFamily: {
        rajdhani: ["Rajdhani", "sans-serif"],
        mono: ["Share Tech Mono", "monospace"],
      },
    },
  },
  plugins: [],
}

