import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    host: true,
    proxy: {
      // Proxy all /api/* requests to the AI backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path,
        // Don't fail the dev server if the backend is not running
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.warn('[Vite Proxy] AI Server not reachable (fallback mode active):', err.message);
            if (!res.headersSent) {
              (res as any).writeHead(503, { 'Content-Type': 'application/json' });
              (res as any).end(JSON.stringify({
                error: 'AI server not running',
                provider: 'fallback',
                isLive: false,
                message: 'Start the AI server with: node server/aiServer.js'
              }));
            }
          });
        }
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          lucide: ['lucide-react']
        }
      }
    }
  }
});
