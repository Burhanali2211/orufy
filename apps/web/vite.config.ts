import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },
    },
  },
  css: {
    devSourcemap: true, // Better CSS error reporting
  },
  optimizeDeps: {
    exclude: [], // Ensure all deps are optimized
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React — smallest chunk, loaded first
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/') || id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // Heavy animation lib — separate so pages that don't need it skip it
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-motion';
          }
          // Icon lib — large, shared across all pages
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          // Supabase — only loaded on data-fetching paths
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          // Recharts — admin dashboard only; public pages should never load this
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) {
            return 'vendor-charts';
          }
        },
      },
    },
  },
});
