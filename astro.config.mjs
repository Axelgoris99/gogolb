import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  output: 'static', // Explicitly specify static output (which is also the default)
  site: 'https://blog.goris.live',
  integrations: [
    mdx(),
    sitemap()
  ],
  // Scoped styles add no specificity, so skin overrides (src/styles/skins/)
  // always beat the component styles they target.
  scopedStyleStrategy: 'where',
  // Fetch pages on link hover so navigations feel instant
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  markdown: {
    // Code blocks stay dark in every skin (see src/styles/blog.css)
    shikiConfig: { theme: 'github-dark' },
  },
});
