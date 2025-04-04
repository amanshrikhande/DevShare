import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@monaco-editor/react'], // Ensure it's bundled
  },
  build: {
    rollupOptions: {
      external: ['@monaco-editor/react'], // Try excluding it
    },
  },
});
