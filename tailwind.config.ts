import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Signal Insight Midnight & Light Editorial Design System Tokens
        main: 'var(--bg-main, #05070E)',
        card: 'var(--bg-card, #0B101D)',
        surface: 'var(--bg-surface, #0B101D)',
        elevated: 'var(--bg-elevated, #111827)',
        'border-default': 'var(--border-color, rgba(255, 255, 255, 0.08))',
        'footer-bg': 'var(--footer-bg, #030509)',
        cosmic: {
          base: '#05070E',
          surface: '#0B101D',
          elevated: '#111827',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-subtle': 'rgba(255, 255, 255, 0.05)',
        },
        electric: {
          blue: '#3B82F6',
          hover: '#60A5FA',
          light: 'rgba(59, 130, 246, 0.14)',
          glow: 'rgba(59, 130, 246, 0.25)',
        },
        'signal-insight': {
          blue: '#3B82F6',
          'blue-hover': '#60A5FA',
          'blue-light': 'rgba(59, 130, 246, 0.14)',
          cyan: '#22D3EE',
          'cyan-hover': '#38BDF8',
          'cyan-light': 'rgba(34, 211, 238, 0.15)',
          dark: '#0B101D',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
          0: '#FFFFFF',
        },
        brand: {
          primary: '#2563EB',
          'primary-hover': '#1D4ED8',
          'primary-light': '#EFF6FF',
          cyan: '#0891B2',
          'cyan-light': '#ECFEFF',
          accent: '#0891B2',
          warning: '#D97706',
          emerald: '#059669',
          violet: '#7C3AED',
        },
        bg: {
          primary: 'var(--bg-card, #FFFFFF)',
          secondary: 'var(--bg-main, #F8FAFC)',
          tertiary: '#F1F5F9',
          elevated: '#FFFFFF',
        },
        text: {
          primary: 'var(--text-primary, #172033)',
          secondary: 'var(--text-secondary, #64748B)',
          muted: '#94A3B8',
        },
        border: {
          subtle: '#F1F5F9',
          default: 'var(--border-color, #E2E8F0)',
        },
      },
      fontFamily: {
        display: ['Inter Tight', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        display: ['clamp(2.25rem, 4.5vw, 3.75rem)', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '800' }],
        h1: ['clamp(1.85rem, 3.5vw, 2.75rem)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '800' }],
        h2: ['clamp(1.4rem, 2.5vw, 2rem)', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '700' }],
        h3: ['clamp(1.15rem, 2vw, 1.5rem)', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
        lead: ['clamp(1.05rem, 1.75vw, 1.2rem)', { lineHeight: '1.65', fontWeight: '400' }],
        body: ['0.975rem', { lineHeight: '1.65' }],
        small: ['0.875rem', { lineHeight: '1.55' }],
        caption: ['0.75rem', { lineHeight: '1.45' }],
      },
      maxWidth: {
        narrow: '680px',      // Article prose
        medium: '920px',      // Supporting pages
        wide: '1200px',       // Standard section
        full: '1360px',       // Full page width
      },
      container: {
        center: true,
        padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
        screens: { narrow: '680px', medium: '920px', wide: '1200px', full: '1360px' },
      },
      boxShadow: {
        editorial: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'editorial-hover': '0 10px 25px -5px rgba(37,99,235,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)',
        midnight: '0 12px 28px -6px rgba(0, 0, 0, 0.45)',
        'electric-glow': '0 0 25px rgba(59, 130, 246, 0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config
