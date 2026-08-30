import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const buildDate = new Date();
  const buildTimeStr = buildDate.toISOString();
  const buildId = `${buildDate.getFullYear()}${String(buildDate.getMonth() + 1).padStart(2, '0')}${String(buildDate.getDate()).padStart(2, '0')}.${String(buildDate.getHours()).padStart(2, '0')}${String(buildDate.getMinutes()).padStart(2, '0')}`;

  return {
    plugins: [react(), tailwindcss()],
    define: {
      '__APP_BUILD_TIME__': JSON.stringify(buildTimeStr),
      '__APP_BUILD_ID__': JSON.stringify(buildId),
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
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
