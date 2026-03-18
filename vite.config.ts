import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [],
    },
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {},
  },
  optimizeDeps: {
    include: ["react-is"],
  },
})