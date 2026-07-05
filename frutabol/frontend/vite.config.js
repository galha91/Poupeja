import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em dev, o Vite faz proxy da API e do socket.io para o backend local —
// assim o frontend corre em :5173 sem problemas de CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:4000",
      "/socket.io": { target: "http://localhost:4000", ws: true },
    },
  },
});
