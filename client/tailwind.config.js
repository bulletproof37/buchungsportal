/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Buchungsportal Farbschema (weiche Pastelltöne)
        'booking': {
          DEFAULT: '#6ee7b7', // Sanftes Grün für Buchungen
          light: '#a7f3d0',
          dark: '#34d399'
        },
        'reservation': {
          DEFAULT: '#fdba74', // Sanftes Orange für Reservierungen
          light: '#fed7aa',
          dark: '#fb923c'
        },
        'weekend': {
          DEFAULT: '#f3f4f6', // Hellgrau für Wochenenden/Feiertage
        }
      }
    },
  },
  plugins: [],
}
