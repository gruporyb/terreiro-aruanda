import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // No desenvolvimento, /ws vai para o servidor online local (npm run server).
    proxy: { "/ws": { target: "ws://localhost:8085", ws: true } },
  },
});
