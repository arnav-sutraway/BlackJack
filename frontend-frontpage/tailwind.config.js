/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        casino: {
          green: '#0F3B20',
          panel: '#121212',
          red: '#D32F2F',
        }
      }
    },
  },
  plugins: [],
}
