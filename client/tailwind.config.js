/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Buchungsportal Farbschema
        'booking': {
          DEFAULT: '#22c55e', // Grün für Buchungen
          light: '#86efac',
          dark: '#16a34a'
        },
        'reservation': {
          DEFAULT: '#f97316', // Orange für Reservierungen
          light: '#fdba74',
          dark: '#ea580c'
        },
        'weekend': {
          DEFAULT: '#f3f4f6', // Hellgrau für Wochenenden/Feiertage
        }
      }
    },
  },
  plugins: [],
}
