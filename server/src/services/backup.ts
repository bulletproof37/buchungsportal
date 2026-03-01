import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupDir = path.join(__dirname, '../../../data/backups');
const MAX_BACKUPS = 14; // 14 Tage aufbewahren

// Externes Backup-Verzeichnis (Dokumente des aktuellen Benutzers)
const externalBackupDir = path.join(os.homedir(), 'Documents', 'Buchungsportal-Backup');
const MAX_EXTERNAL_BACKUPS = 30; // 30 externe Kopien aufbewahren

/**
 * Erstellt ein Backup der Datenbank (lokal + extern)
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
      .then(() => {
        console.log(`Backup erstellt: ${backupPath}`);
        // Nach erfolgreichem lokalem Backup: externe Kopie anlegen
        copyToExternalBackup(backupPath, timestamp);
      })
      .catch((err: Error) => console.error('Backup fehlgeschlagen:', err));

    // Alte lokale Backups aufräumen
    cleanOldBackups(backupDir, 'bookings_', MAX_BACKUPS);
  } catch (error) {
    console.error('Fehler beim Erstellen des Backups:', error);
  }
}

/**
 * Kopiert ein fertiges Backup in das externe Verzeichnis (Dokumente)
 */
function copyToExternalBackup(sourcePath: string, timestamp: string): void {
  try {
    if (!fs.existsSync(externalBackupDir)) {
      fs.mkdirSync(externalBackupDir, { recursive: true });
    }

    const destPath = path.join(externalBackupDir, `bookings_${timestamp}.db`);
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Externes Backup: ${destPath}`);

    cleanOldBackups(externalBackupDir, 'bookings_', MAX_EXTERNAL_BACKUPS);
  } catch (error) {
    // Externes Backup ist optional — Fehler nur loggen, nicht werfen
    console.warn('Externes Backup fehlgeschlagen (nicht kritisch):', error);
  }
}

/**
 * Löscht älteste Backups wenn Maximum überschritten
 */
function cleanOldBackups(dir: string, prefix: string, maxCount: number): void {
  try {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith(prefix) && f.endsWith('.db'))
      .sort()
      .reverse(); // neueste zuerst

    const toDelete = files.slice(maxCount);
    for (const file of toDelete) {
      fs.unlinkSync(path.join(dir, file));
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
    setInterval(createBackup, 24 * 60 * 60 * 1000);
  }, msUntilFirst);

  console.log(`Automatisches Backup geplant: ${nextBackup.toLocaleString('de-DE')}`);
}
