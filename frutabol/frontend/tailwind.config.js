/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
      },
      keyframes: {
        aparecer: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "none" } },
        pulsar: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.55 } },
      },
      animation: {
        aparecer: "aparecer .3s ease-out",
        pulsar: "pulsar 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
