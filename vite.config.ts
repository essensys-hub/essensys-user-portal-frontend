import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/portal/',
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
