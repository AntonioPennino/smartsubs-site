/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./404.html",
    "./assets/js/main.js"
  ],
  theme: {
    extend: {
      colors: {
        brandPurple: '#6D26D9',
        brandOrange: '#F97316',
        bgDark: '#111113',
        bgPanel: '#1E1E24'
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Montserrat', 'sans-serif']
      }
    }
  },
  plugins: []
}
