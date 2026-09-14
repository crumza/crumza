// @ts-check
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

/** @param {string} p */
const src = (p) => fileURLToPath(new URL(p, import.meta.url));

// The site consumes the library straight from ../src so the docs never drift from the code.
export default defineConfig({
  site: 'https://crumza.com',
  output: 'static',
  trailingSlash: 'never',
  integrations: [react(), mdx(), sitemap()],
  redirects: { '/docs': '/docs/getting-started' },
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, wrap: false },
  },
  vite: {
    // Astro check/sync prebundles production React. Never overwrite a live dev cache.
    cacheDir: src(`./node_modules/.vite/${process.env['NODE_ENV'] ?? 'development'}`),
    plugins: [tailwindcss()],
    resolve: {
      alias: [
        { find: '@crumza/ui/web', replacement: src('../../packages/ui/src/web/index.ts') },
        { find: '@crumza/ui/tokens', replacement: src('../../packages/ui/src/tokens/index.ts') },
        { find: '@crumza/ui/core', replacement: src('../../packages/ui/src/core/index.ts') },
        { find: '@crumza/ui', replacement: src('../../packages/ui/src/index.ts') },
        { find: '@crumza/blocks', replacement: src('../../packages/blocks/src/index.tsx') },
      ],
      dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    optimizeDeps: { include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'tailwind-merge'] },
    server: { fs: { allow: [src('../..')] } },
  },
});
