import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupDir = path.join(__dirname, '../../../data/backups');
const MAX_BACKUPS = 14; // 14 Tage aufbewahren

/**
 * Erstellt ein Backup der Datenbank
 */
export function createBackup(): void {
  try {
    const db = getDatabase();

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const backupPath = path.join(backupDir, `bookings_${timestamp}.db`);

    // better-sqlite3 hat eine eingebaute backup()-Methode
    db.backup(backupPath)
      .then(() => console.log(`Backup erstellt: ${backupPath}`))
      .catch((err: Error) => console.error('Backup fehlgeschlagen:', err));

    // Alte Backups aufräumen
    cleanOldBackups();
  } catch (error) {
    console.error('Fehler beim Erstellen des Backups:', error);
  }
}

/**
 * Löscht Backups die älter als MAX_BACKUPS Tage sind
 */
function cleanOldBackups(): void {
  try {
    if (!fs.existsSync(backupDir)) return;

    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('bookings_') && f.endsWith('.db'))
      .sort()
      .reverse(); // neueste zuerst

    const toDelete = files.slice(MAX_BACKUPS);
    for (const file of toDelete) {
      fs.unlinkSync(path.join(backupDir, file));
      console.log(`Altes Backup gelöscht: ${file}`);
    }
  } catch (error) {
    console.error('Fehler beim Aufräumen alter Backups:', error);
  }
}

/**
 * Startet automatische tägliche Backups
 */
export function startAutoBackup(): void {
  // Sofort beim Start ein Backup erstellen
  createBackup();

  // Dann täglich um 03:00 Uhr
  const now = new Date();
  const nextBackup = new Date();
  nextBackup.setHours(3, 0, 0, 0);
  if (nextBackup <= now) {
    nextBackup.setDate(nextBackup.getDate() + 1);
  }

  const msUntilFirst = nextBackup.getTime() - now.getTime();

  setTimeout(() => {
    createBackup();
    // Danach alle 24h wiederholen
    setInterval(createBackup, 24 * 60 * 60 * 1000);
  }, msUntilFirst);

  console.log(`Automatisches Backup geplant: ${nextBackup.toLocaleString('de-DE')}`);
}
