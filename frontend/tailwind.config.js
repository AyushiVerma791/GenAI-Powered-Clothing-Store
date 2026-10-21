/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f9f6f0',
          100: '#f2ece0',
          200: '#e5d8c2',
          500: '#b89c72',
          600: '#9b7e55',
          700: '#7a6140',
          900: '#2b2114',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
