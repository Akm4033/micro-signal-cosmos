import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Professional neutral palette - warm, not cold
        neutral: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#0f0f0f',
          0: '#ffffff',
        },
        // Professional brand colors - not too blue, not too purple
        brand: {
          primary: '#1d4ed8',        // Professional blue (blue-700)
          'primary-hover': '#1e40af',
          'primary-light': '#eff6ff',
          'primary-muted': '#eff6ff',
          accent: '#059669',         // Professional green (emerald-600)
          'accent-hover': '#047857',
          'accent-light': '#ecfdf5',
          'accent-muted': '#ecfdf5',
          warning: '#d97706',        // Amber for warnings
          sky: '#0ea5e9',
          'sky-deep': '#1e40af',
          'sky-muted': '#eff6ff',
          violet: '#8b5cf6',
          'violet-deep': '#7c3aed',
          'violet-muted': '#f3e8ff',
        },
        // Semantic aliases
        bg: {
          primary: 'var(--bg-primary, #ffffff)',
          secondary: 'var(--bg-secondary, #fafafa)',
          tertiary: 'var(--bg-tertiary, #f4f4f5)',
          elevated: 'var(--bg-elevated, #ffffff)',
        },
        text: {
          primary: 'var(--text-primary, #0f0f0f)',
          secondary: 'var(--text-secondary, #3f3f46)',
          muted: 'var(--text-muted, #71717a)',
        },
        border: {
          subtle: 'var(--border-subtle, #e4e4e7)',
          default: 'var(--border-default, #d4d4d8)',
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
