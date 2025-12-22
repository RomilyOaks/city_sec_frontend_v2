/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F4F7EE',
          100: '#E6EED6',
          200: '#CBDCAA',
          300: '#AFC97E',
          400: '#93B355',
          500: '#779A3A',
          600: '#5D7B2E',
          700: '#4A6126',
          800: '#3C4E21',
          900: '#2F3D1A',
        },
      },
    },
  },
  plugins: [],
}

