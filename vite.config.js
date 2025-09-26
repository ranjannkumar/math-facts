import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Anything starting with /api is proxied to the backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // If your backend does NOT mount under /api, uncomment next line:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
