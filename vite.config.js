import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ include: /\.[jt]sx?$/ })],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split rarely-changing vendor code into its own chunks so a deploy
        // of app code doesn't invalidate the (much larger) Firebase and React
        // bundles in returning visitors' browser caches. Also lets the
        // browser download app and vendor code in parallel on first load.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
