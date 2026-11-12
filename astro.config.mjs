// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rss from '@astrojs/rss';

export default defineConfig({
  site: 'https://signal-insight.pages.dev',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    rss({
      title: 'Signal Insight',
      description: 'Your daily signal for technology, science, and knowledge.',
      site: 'https://signal-insight.pages.dev',
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
    gfm: true,
  },
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
    assets: 'assets',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  vite: {
    resolve: {
      alias: {
        '@/*': './src/*',
      },
    },
  },
});