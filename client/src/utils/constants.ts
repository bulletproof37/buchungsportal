// UI-Texte und Labels (Deutsch)
export const LABELS = {
  // Navigation
  APP_TITLE: 'Buchungsportal',
  APP_SUBTITLE: 'Bioferienhof Loreley',
  NEW_BOOKING: 'Neue Buchung',
  SETTINGS: 'Einstellungen',
  STATISTICS: 'Statistik',

  // Buchungsformular
  HOUSE: 'Ferienhaus',
  CHECK_IN: 'Anreise',
  CHECK_OUT: 'Abreise',
  GUEST_LAST_NAME: 'Nachname',
  GUEST_FIRST_NAME: 'Vorname',
  GUEST_PHONE: 'Telefon',
  GUEST_EMAIL: 'E-Mail',
  GUEST_STREET: 'Straße',
  GUEST_ZIP: 'PLZ',
  GUEST_CITY: 'Ort',
  GUEST_COUNT: 'Anzahl Personen',
  DOG_COUNT: 'Anzahl Hunde',
  NOTES: 'Notizen',
  STATUS: 'Status',
  STATUS_RESERVATION: 'Reservierung',
  STATUS_BOOKING: 'Buchung',

  // Preisberechnung
  NIGHTS: 'Nächte',
  PRICE_PER_NIGHT: 'Nachtpreis',
  SURCHARGE_FIRST_NIGHT: 'Aufpreis erste Nacht',
  DOG_COSTS: 'Hundekosten',
  TOTAL_PRICE: 'Gesamtpreis',

  // Aktionen
  SAVE: 'Speichern',
  CANCEL: 'Abbrechen',
  DELETE: 'Löschen',
  DOWNLOAD_PDF: 'PDF herunterladen',
  CONFIRM_DELETE: 'Wirklich löschen?',
  CONFIRM_DELETE_TEXT: 'Möchten Sie diese Buchung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',

  // Statistik
  PERIOD: 'Zeitraum',
  THIS_YEAR: 'Dieses Jahr',
  LAST_YEAR: 'Letztes Jahr',
  THIS_MONTH: 'Diesen Monat',
  LAST_MONTH: 'Letzten Monat',
  OVERNIGHT_STAYS: 'Übernachtungen',
  BOOKINGS: 'Buchungen',
  RESERVATIONS: 'Reservierungen',
  OCCUPANCY_RATE: 'Belegung',
  REVENUE: 'Umsatz',
  TOTAL: 'Gesamt',

  // Monate
  MONTHS: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ],

  // Wochentage
  WEEKDAYS: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  WEEKDAYS_LONG: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
} as const;

// Fehlermeldungen
export const ERRORS = {
  REQUIRED_FIELD: 'Dieses Feld ist erforderlich',
  INVALID_DATE: 'Ungültiges Datum',
  CHECK_OUT_BEFORE_CHECK_IN: 'Das Abreisedatum muss nach dem Anreisedatum liegen',
  MIN_NIGHTS: (min: number) => `Mindestaufenthalt: ${min} Nächte`,
  OVERLAP: 'In diesem Zeitraum ist das Ferienhaus bereits belegt',
  LOAD_ERROR: 'Fehler beim Laden der Daten',
  SAVE_ERROR: 'Fehler beim Speichern',
  DELETE_ERROR: 'Fehler beim Löschen',
  NETWORK_ERROR: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.'
} as const;

// Farben für Tailwind-Klassen
export const COLORS = {
  BOOKING: {
    bg: 'bg-booking',
    bgLight: 'bg-booking-light',
    border: 'border-booking',
    text: 'text-booking-dark'
  },
  RESERVATION: {
    bg: 'bg-reservation',
    bgLight: 'bg-reservation-light',
    border: 'border-reservation',
    text: 'text-reservation-dark'
  },
  WEEKEND: {
    bg: 'bg-weekend'
  }
} as const;

// API-Endpunkte
export const API = {
  HOUSES: '/api/houses',
  BOOKINGS: '/api/bookings',
  SETTINGS: '/api/settings',
  STATISTICS: '/api/statistics'
} as const;

// Standard-Werte
export const DEFAULTS = {
  SURCHARGE_FIRST_NIGHT: 35,
  PRICE_PER_DOG_NIGHT: 5,
  MIN_NIGHTS: 2,
  DOG_COUNT: 0
} as const;
