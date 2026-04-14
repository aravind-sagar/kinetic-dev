import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import devServer from '@hono/vite-dev-server';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      devServer({
        entry: 'api/[...route].ts',
        injectClientScript: false,
        // Only Hono handles /api/* — all other paths fall through to Vite SPA
        exclude: [/^\/(?!api($|\/))/],
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('mermaid')) return 'vendor-mermaid';
              if (id.includes('pdfjs-dist')) return 'vendor-pdfjs';
              if (id.includes('docx') || id.includes('jspdf') || id.includes('mammoth')) return 'vendor-docs';
              if (id.includes('lucide-react')) return 'vendor-icons';
              return 'vendor';
            }
          },
        },
      },
      chunkSizeWarningLimit: 4000,
    },
  };
});
