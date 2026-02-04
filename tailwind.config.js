/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0D2C54',
        secondary: '#2F5D9F',
        soft: '#6F8FBF',
        beige: '#E6DED3',
        accent: '#D39B2C',
      },
    },
  },
  plugins: [],
};
