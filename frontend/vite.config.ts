import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
        '@entities': fileURLToPath(new URL('./src/entities', import.meta.url)),
        '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
        '@widgets': fileURLToPath(new URL('./src/widgets', import.meta.url)),
        '@routes': fileURLToPath(new URL('./src/routes', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('/node_modules/recharts/')) return 'vendor-charts';
            if (id.includes('/node_modules/@supabase/'))
              return 'vendor-supabase';
            if (id.includes('/node_modules/@tanstack/react-query/'))
              return 'vendor-query';
            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/react-router')
            )
              return 'vendor-react';
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
