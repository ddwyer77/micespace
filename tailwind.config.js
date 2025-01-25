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
          light: '#6D28D9',
          DEFAULT: '#D94125', 
          dark: '#d55147', 
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

