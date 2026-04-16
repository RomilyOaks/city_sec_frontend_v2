import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: false,
      port: 5174, // Puerto diferente para HMR
    },
    watch: {
      usePolling: true, // Forzar polling en Windows
      interval: 1000,
    },
    fs: {
      strict: false, // Menos estricto con archivos
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'], // Pre-bundle deps
  },
})
