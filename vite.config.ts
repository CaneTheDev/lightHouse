import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // pdfjs-dist uses dynamic requires internally; exclude from pre-bundling
    // so Vite serves it as-is and the ?url worker import resolves correctly.
    exclude: ['pdfjs-dist'],
  },
})
