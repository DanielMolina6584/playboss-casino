/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#05080D',
          secondary: '#080D13',
        },
        card: {
          DEFAULT: '#0D131A',
          hover: '#111922',
        },
        gold: {
          DEFAULT: '#FFC400',
          secondary: '#E6AA00',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8D96A3',
        },
        border: {
          subtle: 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        250: '250ms',
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(255,196,0,0.25), 0 8px 24px -8px rgba(255,196,0,0.35)',
        card: '0 4px 16px -4px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
