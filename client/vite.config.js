import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  // Read PORT from the repo-root .env so the proxy always targets the right backend.
  const env = loadEnv(mode, path.resolve(process.cwd(), '..'), '');
  const target = env.VITE_SERVER_URL || `http://localhost:${env.PORT || 4000}`;
  return {
    plugins: [react()],
    server: {
      host: true, // reachable from the TV / phone on your LAN
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/socket.io': { target, ws: true, changeOrigin: true },
      },
    },
    // Conservative target: TV WebViews can lag well behind desktop Chrome.
    build: { target: 'es2018', chunkSizeWarningLimit: 900 },
  };
});
