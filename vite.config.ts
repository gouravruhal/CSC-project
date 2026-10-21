import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('pdf-lib')) return 'vendor-pdf';
              if (id.includes('motion')) return 'vendor-motion';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
              return 'vendor-libs';
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true as const,
      cors: true,
      hmr: process.env.DISABLE_HMR !== 'true' ? { clientPort: 3000 } : false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
