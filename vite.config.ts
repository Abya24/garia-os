import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isHmrDisabled = process.env.DISABLE_HMR === 'true' || env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'src/$1') },
        { find: '@', replacement: path.resolve(__dirname, 'src') },
        { find: '@root', replacement: path.resolve(__dirname, '.') },
      ],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || mode || 'development'),
      'process.env.DISABLE_HMR': JSON.stringify(isHmrDisabled ? 'true' : 'false'),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      target: 'esnext',
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
                return 'vendor-charts';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
                return 'vendor-react';
              }
            }
            if (id.includes('masterCurriculum')) {
              return 'data-master-curriculum';
            }
            if (id.includes('careerDatabase') || id.includes('careerEngine')) {
              return 'data-career-engine';
            }
            if (
              id.includes('questionBankEngine') ||
              id.includes('examIntelligenceEngine') ||
              id.includes('examEngine') ||
              id.includes('academicEngine') ||
              id.includes('academicDecisionEngine') ||
              id.includes('abyaFallbackEngine')
            ) {
              return 'data-academic-exam-engine';
            }
            if (id.includes('quotes')) {
              return 'data-quotes';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify -- file watching is disabled to prevent flickering during agent edits.
      hmr: !isHmrDisabled,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: isHmrDisabled ? null : {},
    },
  };
});
