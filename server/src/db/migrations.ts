import { getDatabase } from './database.js';

/**
 * Führt alle Datenbank-Migrationen aus
 */
export function runMigrations(): void {
  const db = getDatabase();

  // Tabelle: houses (Ferienhäuser)
  db.exec(`
    CREATE TABLE IF NOT EXISTS houses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price_per_night DECIMAL(10,2) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Tabelle: bookings (Buchungen)
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      house_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('reservation', 'booking')),
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      guest_last_name TEXT NOT NULL,
      guest_first_name TEXT NOT NULL,
      guest_email TEXT,
      guest_phone TEXT NOT NULL,
      guest_street TEXT,
      guest_zip TEXT,
      guest_city TEXT,
      guest_count INTEGER,
      dog_count INTEGER NOT NULL DEFAULT 0,
      price_per_night DECIMAL(10,2) NOT NULL,
      surcharge_first_night DECIMAL(10,2) NOT NULL DEFAULT 35.00,
      price_per_dog_night DECIMAL(10,2) NOT NULL DEFAULT 5.00,
      total_price DECIMAL(10,2) NOT NULL,
      notes TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (house_id) REFERENCES houses(id)
    )
  `);

  // Index für schnelle Abfragen nach Jahr/Haus
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookings_house_dates
    ON bookings(house_id, check_in, check_out)
  `);

  // Tabelle: settings (Einstellungen)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Tabelle: blocks (Gesperrte Zeiträume)
  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      house_id INTEGER NOT NULL,
      date_from DATE NOT NULL,
      date_to DATE NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (house_id) REFERENCES houses(id)
    )
  `);

  // Sortierreihenfolge der Häuser festlegen
  db.exec(`
    UPDATE houses SET sort_order = 1 WHERE name = 'Dalarna';
    UPDATE houses SET sort_order = 2 WHERE name = 'Värmland';
    UPDATE houses SET sort_order = 3 WHERE name = 'Lönneberga';
    UPDATE houses SET sort_order = 4 WHERE name = 'Lappland';
    UPDATE houses SET sort_order = 5 WHERE name = 'Småland';
  `);

  console.log('Datenbank-Migrationen erfolgreich ausgeführt.');
}

export default runMigrations;
