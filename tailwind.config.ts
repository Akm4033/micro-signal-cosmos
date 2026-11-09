import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
          sky: '#0ea5e9',
          'sky-deep': '#0284c7',
          'sky-muted': '#e0f2fe',
          violet: '#8b5cf6',
          'violet-deep': '#7c3aed',
          'violet-muted': '#f3e8ff',
        },
        // Warm Neutrals (semantic)
        neutral: {
          950: '#0a0f1a',
          900: '#111827',
          800: '#1f2937',
          700: '#374151',
          600: '#4b5563',
          500: '#6b7280',
          400: '#9ca3af',
          300: '#d1d5db',
          200: '#e5e7eb',
          100: '#f3f4f6',
          50: '#f9fafb',
          0: '#ffffff',
        },
        // Semantic aliases
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          elevated: 'var(--bg-elevated)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          default: 'var(--border-default)',
        },
      },
      fontFamily: {
        display: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        display: ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '800' }],
        h1: ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '800' }],
        h2: ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        h3: ['clamp(1.25rem, 2.5vw, 1.75rem)', { lineHeight: '1.25', fontWeight: '700' }],
        lead: ['clamp(1.125rem, 2vw, 1.25rem)', { lineHeight: '1.7', fontWeight: '400' }],
        body: ['1rem', { lineHeight: '1.7' }],
        small: ['0.875rem', { lineHeight: '1.6' }],
        caption: ['0.75rem', { lineHeight: '1.5' }],
      },
      spacing: {
        1: '0.25rem', 2: '0.5rem', 3: '0.75rem', 4: '1rem',
        5: '1.25rem', 6: '1.5rem', 8: '2rem', 10: '2.5rem',
        12: '3rem', 16: '4rem', 20: '5rem', 24: '6rem',
      },
      maxWidth: {
        narrow: '640px',      // Article body
        medium: '896px',      // Category pages
        wide: '1152px',       // Homepage sections
        full: '1408px',       // Full-bleed
      },
      container: {
        center: true,
        padding: { DEFAULT: '1.5rem', sm: '2rem', lg: '3rem' },
        screens: { narrow: '640px', medium: '896px', wide: '1152px', full: '1408px' },
      },
      transitionDuration: { DEFAULT: '200ms' },
      transitionTimingFunction: { DEFAULT: 'ease-out' },
    },
  },
  plugins: [],
} satisfies Config
