import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static SPA — no backend. Deploys as static files (e.g. Vercel "Other" / static).
export default defineConfig({
  plugins: [react()],
  // Honour an assigned PORT (preview harness) but default to 5173 for local dev.
  server: { port: Number(process.env.PORT) || 5173 },
})
