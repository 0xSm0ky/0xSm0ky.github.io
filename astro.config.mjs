import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { visit } from 'unist-util-visit';

// Opens off-site links in a new tab. Internal links and footnote anchors stay in-place.
function rehypeExternalLinks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string' || !/^https?:\/\//.test(href)) return;
      node.properties.target = '_blank';
      node.properties.rel = 'noopener noreferrer';
    });
  };
}

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
    remarkRehype: {
      footnoteLabel: 'هامش',
      footnoteBackLabel: 'رجوع',
    },
    rehypePlugins: [rehypeExternalLinks],
  },
});
