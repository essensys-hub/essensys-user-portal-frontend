import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootBase =
  process.env.VITE_PORTAL_ROOT === 'true' || process.env.VITE_DEMO_ROOT === 'true';

export default defineConfig({
  plugins: [react()],
  base: rootBase ? '/' : '/portal/',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5174,
    proxy: {
      '/api/portal': 'http://127.0.0.1:8081',
    },
  },
});
