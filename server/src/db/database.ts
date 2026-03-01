import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Datenbank-Pfad: server/data/bookings.db
const dbPath = path.join(__dirname, '../../data/bookings.db');

// Datenbank-Instanz (Singleton)
let db: Database.Database | null = null;

/**
 * Initialisiert better-sqlite3 und lädt/erstellt die Datenbank
 */
export function initDatabase(): Database.Database {
  if (db) return db;

  // Verzeichnis erstellen falls nicht vorhanden
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(dbPath);

  // WAL-Modus für bessere Performance und Datensicherheit
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  console.log('Datenbank geladen:', dbPath);
  return db;
}

/**
 * Gibt die Datenbank-Instanz zurück (muss vorher initialisiert sein)
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Datenbank nicht initialisiert. Rufe zuerst initDatabase() auf.');
  }
  return db;
}

/**
 * Schließt die Datenbank-Verbindung (WAL wird automatisch committed)
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Hilfsfunktion: Führt eine SQL-Abfrage aus und gibt alle Ergebnisse zurück
 */
export function queryAll<T>(sql: string, params: unknown[] = []): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.all(...params) as T[];
}

/**
 * Hilfsfunktion: Führt eine SQL-Abfrage aus und gibt das erste Ergebnis zurück
 */
export function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

/**
 * Hilfsfunktion: Führt eine SQL-Anweisung aus (INSERT, UPDATE, DELETE)
 */
export function run(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: number } {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  const result = stmt.run(...params);
  return {
    changes: result.changes,
    lastInsertRowid: Number(result.lastInsertRowid)
  };
}

export default getDatabase;
