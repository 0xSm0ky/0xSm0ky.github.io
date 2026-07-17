import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// Deploys to https://0xSm0ky.github.io (user root repo — no `base` needed).
export default defineConfig({
  site: 'https://0xSm0ky.github.io',
  prefetch: { prefetchAll: true },
  integrations: [mdx()],
  build: { inlineStylesheets: 'always' },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
});
