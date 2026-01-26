import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

console.log('Vite config loaded');

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-test',
    emptyOutDir: true,
  },
});
