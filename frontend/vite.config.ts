import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy les appels API vers le backend FastAPI — élimine le CORS en local.
    // VITE_API_URL doit être vide dans .env.dev pour que les requêtes passent par ce proxy.
    proxy: {
      '^/(auth|candidatures|relances|candidature-events|contact-interactions|contacts|etablissements|me|subscription|admin|health)': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/setup.ts'],
    },
  },
})
