import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@crumza/ui/styles.css': fileURLToPath(new URL('../../packages/ui/src/web/styles/crumza.css', import.meta.url)),
      '@crumza/ui/web': fileURLToPath(new URL('../../packages/ui/src/web/index.ts', import.meta.url)),
      '@crumza/ui/liquid': fileURLToPath(new URL('../../packages/ui/src/liquid/index.ts', import.meta.url)),
      '@crumza/ui': fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url)),
    },
  },
});
