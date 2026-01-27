import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const apiBase = process.env.VITE_GPU_API_BASE;

  return {
    plugins: [react()],
    server: {
      port: 3000,
      ...(apiBase && {
        proxy: {
          '/api': {
            target: apiBase,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
          },
        },
      }),
    },
  };
});
