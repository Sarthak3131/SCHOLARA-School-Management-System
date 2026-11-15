/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── SCHOLARA Design System ─────────────────────────────────────
        ivory:      { DEFAULT: '#F7F5EF', dark: '#EDE9DF' },
        forest:     { DEFAULT: '#183D32', light: '#1F4E40', dark: '#102B23' },
        charcoal:   { DEFAULT: '#252923', light: '#3A3D34', dark: '#1A1D16' },
        gold:       { DEFAULT: '#C4A66A', light: '#D4B87A', dark: '#A8894E' },
        sage:       { DEFAULT: '#E5EBE3', dark: '#CDD5CA' },
        muted:      { DEFAULT: '#85877F', light: '#A0A298' },
        // ── Status ────────────────────────────────────────────────────
        success:    { DEFAULT: '#2D6A4F', light: '#52B788', bg: '#D8F3DC' },
        warning:    { DEFAULT: '#B08800', light: '#F4D03F', bg: '#FFF8DC' },
        danger:     { DEFAULT: '#C0392B', light: '#E74C3C', bg: '#FDECEA' },
        info:       { DEFAULT: '#1A5276', light: '#2980B9', bg: '#D6EAF8' },
      },
      fontFamily: {
        sans:      ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        editorial: ['Playfair Display', 'Georgia', 'serif'],
        mono:      ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'card':   '0 1px 3px 0 rgba(37,41,35,0.07), 0 1px 2px -1px rgba(37,41,35,0.07)',
        'card-md':'0 4px 6px -1px rgba(37,41,35,0.08), 0 2px 4px -2px rgba(37,41,35,0.08)',
        'card-lg':'0 10px 15px -3px rgba(37,41,35,0.09), 0 4px 6px -4px rgba(37,41,35,0.09)',
        'sidebar':'4px 0 24px 0 rgba(24,61,50,0.12)',
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      animation: {
        'fade-in':     'fadeIn 0.2s ease-out',
        'slide-in':    'slideIn 0.25s ease-out',
        'slide-up':    'slideUp 0.3s ease-out',
        'spin-slow':   'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(-8px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
