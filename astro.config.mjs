// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Dynamically resolve site domain from environment variable (e.g., SITE_URL=https://microsignalcosmos.com)
  // When unconfigured, defaults to undefined to avoid leaking fictitious or localhost URLs.
  site: process.env.SITE_URL || undefined,
  vite: {
    plugins: [tailwindcss()]
  }
});
