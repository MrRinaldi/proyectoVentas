/** @type {import('tailwindcss').Config} */
export default {
  // El modo oscuro lo activa la clase "dark" en <html> (src/utils/theme.js).
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}