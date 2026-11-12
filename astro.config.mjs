// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Canonical site domain for metadata, sitemaps, and RSS feeds
  site: process.env.SITE_URL || 'https://micro-signal-cosmos.pages.dev',
  redirects: {
    '/privacy': '/privacy-policy/',
    '/editorial-policy': '/about/',
    '/fact-checking-policy': '/about/',
    '/corrections-policy': '/contact/',
    // Consolidated Categories (7 -> 4)
    '/category/digital-world': '/category/technology/',
    '/category/tutorials': '/category/developer-tools/',
    '/category/software-tools': '/category/developer-tools/',
    '/category/innovation': '/category/technology/',
    // Legacy initial test articles redirected to complete in-depth versions
    '/articles/understanding-artificial-intelligence': '/articles/how-llms-actually-work/',
    '/articles/scientific-discoveries-and-the-universe': '/articles/how-we-know-what-stars-are-made-of/',
    '/articles/technologies-shaping-digital-future': '/articles/how-browsers-actually-render-a-page/',
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
