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
          DEFAULT: '#93c5fd', // Sanftes Blau für Reservierungen
          light: '#bfdbfe',
          dark: '#3b82f6'
        },
        'weekend': {
          DEFAULT: '#f3f4f6', // Hellgrau für Wochenenden/Feiertage
        },
        'block-period': {
          DEFAULT: '#fca5a5', // Pastel Rot für Sperrzeiten
          light: '#fecaca',
          dark: '#f87171'
        }
      }
    },
  },
  plugins: [],
}
