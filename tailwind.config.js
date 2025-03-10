/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#F5A538',
          DEFAULT: '#F69130', 
          dark: '#D1710F', 
        },
        gray: {
          light: '#EEEDED',
          DEFAULT: '#151515'
        }
      },
    },
  },
  plugins: [],
}

