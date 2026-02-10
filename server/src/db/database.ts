import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Datenbank-Pfad: server/data/bookings.db
const dbPath = path.join(__dirname, '../../data/bookings.db');

// Datenbank-Instanz (Singleton)
let db: SqlJsDatabase | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/**
 * Initialisiert sql.js und lädt/erstellt die Datenbank
 */
export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;

  // sql.js initialisieren
  SQL = await initSqlJs();

  // Verzeichnis erstellen falls nicht vorhanden
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Existierende Datenbank laden oder neue erstellen
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('Bestehende Datenbank geladen:', dbPath);
  } else {
    db = new SQL.Database();
    console.log('Neue Datenbank erstellt');
  }

  return db;
}

/**
 * Gibt die Datenbank-Instanz zurück (muss vorher initialisiert sein)
 */
export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Datenbank nicht initialisiert. Rufe zuerst initDatabase() auf.');
  }
  return db;
}

/**
 * Speichert die Datenbank auf die Festplatte
 */
export function saveDatabase(): void {
  if (!db) return;

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

/**
 * Schließt die Datenbank-Verbindung
 */
export function closeDatabase(): void {
  if (db) {
    saveDatabase();
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
  stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row as T);
  }
  stmt.free();
  return results;
}

/**
 * Hilfsfunktion: Führt eine SQL-Abfrage aus und gibt das erste Ergebnis zurück
 */
export function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  const results = queryAll<T>(sql, params);
  return results[0];
}

/**
 * Hilfsfunktion: Führt eine SQL-Anweisung aus (INSERT, UPDATE, DELETE)
 */
export function run(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: number } {
  const database = getDatabase();
  database.run(sql, params);

  // Änderungen und letzte ID abrufen
  const changesResult = queryOne<{ changes: number }>('SELECT changes() as changes');
  const lastIdResult = queryOne<{ id: number }>('SELECT last_insert_rowid() as id');

  // Nach Änderungen automatisch speichern
  saveDatabase();

  return {
    changes: changesResult?.changes ?? 0,
    lastInsertRowid: lastIdResult?.id ?? 0
  };
}

export default getDatabase;
