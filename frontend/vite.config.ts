import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000';

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-charts': ['recharts'],
          },
        },
      },
    },
    server: {
      host: '127.0.0.1',
      // Une base URL vide conserve la même origine dans le navigateur ; Vite
      // transmet ensuite les appels au backend choisi sans déclencher de CORS.
      proxy: {
        '^/(auth|candidatures|relances|candidature-events|contact-interactions|contacts|etablissements|me|subscription|admin|health)':
          {
            target: apiProxyTarget,
            changeOrigin: true,
            secure: true,
          },
      },
    },
  };
});
