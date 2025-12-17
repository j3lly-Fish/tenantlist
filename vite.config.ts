import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Root directory for Vite (where index.html is located)
  root: './',

  // Public base path
  base: '/',

  // Resolve configuration
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/frontend/components'),
      '@pages': path.resolve(__dirname, './src/frontend/pages'),
      '@hooks': path.resolve(__dirname, './src/frontend/hooks'),
      '@utils': path.resolve(__dirname, './src/frontend/utils'),
      '@contexts': path.resolve(__dirname, './src/frontend/contexts'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },

  // Server configuration
  server: {
    port: 3000,
    host: true,
    strictPort: false,

    // HMR configuration
    hmr: {
      overlay: true,
    },

    // Proxy API calls to backend
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: process.env.VITE_WS_BASE_URL || 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },

  // Build configuration
  build: {
    outDir: 'dist/frontend',
    emptyOutDir: true,
    sourcemap: true,

    // Rollup options
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['axios', 'socket.io-client'],
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },

  // CSS configuration
  css: {
    modules: {
      localsConvention: 'camelCase',
      scopeBehaviour: 'local',
    },
  },

  // Environment variables prefix
  envPrefix: 'VITE_',

  // Preview server configuration
  preview: {
    port: 3001,
    host: true,
    strictPort: false,
  },
});
