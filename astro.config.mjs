// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Canonical site domain for metadata, sitemaps, and RSS feeds
  site: process.env.SITE_URL || 'https://microsignalcosmos.com',
  redirects: {
    '/privacy': '/privacy-policy/',
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
