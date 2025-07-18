const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}', // บอกให้ Tailwind สแกนหา class ในไฟล์เหล่านี้
  ],
  theme: {
    extend: {
      fontFamily: {
        mali: ['Mali', ...defaultTheme.fontFamily.sans],
        sarabun: ['Sarabun', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: '#ff7081', // สีชมพูแดง
        secondary: '#0084C5', // สีน้ำเงินเข้ม
      },
    },
  },
  plugins: [],
};
