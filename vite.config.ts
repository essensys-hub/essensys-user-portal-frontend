import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const demoRoot = process.env.VITE_DEMO_ROOT === 'true';

export default defineConfig({
  plugins: [react()],
  base: demoRoot ? '/' : '/portal/',
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
