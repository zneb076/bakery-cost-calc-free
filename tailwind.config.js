const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        'mali-base': ['1rem', { lineHeight: '1.4rem' }],
        'mali-h1': ['1.9rem', { lineHeight: '2.3rem' }], // Custom size for h1
        'mali-sm': ['0.8rem', { lineHeight: '1.2rem' }], // Custom smaller size
      },
      colors: {
        primary: '#ff7081',
        secondary: '#0084C5',
      },
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px', // <-- จุดเปลี่ยนไปเป็น Desktop
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  plugins: [],
};
