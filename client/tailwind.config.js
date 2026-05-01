/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warmer, more sophisticated orange — less saturated, more premium
        primary: {
          50:  '#fef6ee',
          100: '#fdebd8',
          200: '#fad4b0',
          300: '#f7b57f',
          400: '#f38d4c',
          500: '#f07028', // main — slightly deeper, less neon
          600: '#e15a18',
          700: '#bb4514',
          800: '#953817',
          900: '#783016',
        },
        // Neutral grays with warm undertone
        gray: {
          50:  '#f8f7f5',
          100: '#f0ede9',
          200: '#e4dfd9',
          300: '#d1c9c0',
          400: '#a89f96',
          500: '#7d756c',
          600: '#5c554e',
          700: '#3d3830',
          800: '#2a2520',
          900: '#1a1714',
        },
        accent: {
          50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc',
          300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        logo: ['Outfit', 'sans-serif'],
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1.125rem', letterSpacing: '0.01em' }],
        sm:   ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '-0.005em' }],
        base: ['1rem',     { lineHeight: '1.625rem', letterSpacing: '-0.01em' }],
        lg:   ['1.125rem', { lineHeight: '1.75rem',  letterSpacing: '-0.015em' }],
        xl:   ['1.25rem',  { lineHeight: '1.875rem', letterSpacing: '-0.02em' }],
        '2xl':['1.5rem',   { lineHeight: '2rem',     letterSpacing: '-0.025em' }],
        '3xl':['1.875rem', { lineHeight: '2.25rem',  letterSpacing: '-0.03em' }],
        '4xl':['2.25rem',  { lineHeight: '2.625rem', letterSpacing: '-0.035em' }],
        '5xl':['3rem',     { lineHeight: '3.375rem', letterSpacing: '-0.04em' }],
      },
      borderRadius: {
        'xl':  '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'card':      '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
        'card-hover':'0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        'nav':       '0 -1px 0 rgba(0,0,0,0.06)',
        'sm':        '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)',
        'md':        '0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        'lg':        '0 8px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(100%)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
