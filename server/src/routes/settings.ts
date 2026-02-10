import { Router } from 'express';
import { queryAll, run } from '../db/database.js';

const router = Router();

interface SettingsInput {
  company_name?: string;
  company_address?: string;
  company_zip?: string;
  company_city?: string;
  company_phone?: string;
  company_mobile?: string;
  company_email?: string;
  surcharge_first_night?: number;
  price_per_dog_night?: number;
  min_nights?: number;
}

/**
 * GET /api/settings
 * Gibt alle Einstellungen zurück
 */
router.get('/', (_req, res) => {
  try {
    const rows = queryAll<{ key: string; value: string }>('SELECT key, value FROM settings');

    // In Objekt umwandeln
    const settings: Record<string, string | number> = {};
    for (const row of rows) {
      // Numerische Werte konvertieren
      if (['surcharge_first_night', 'price_per_dog_night', 'min_nights'].includes(row.key)) {
        settings[row.key] = parseFloat(row.value);
      } else {
        settings[row.key] = row.value;
      }
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Fehler beim Laden der Einstellungen:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Einstellungen'
    });
  }
});

/**
 * PUT /api/settings
 * Aktualisiert die Einstellungen
 */
router.put('/', (req, res) => {
  try {
    const input = req.body as SettingsInput;

    // Alle übergebenen Einstellungen aktualisieren
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        run('UPDATE settings SET value = ? WHERE key = ?', [String(value), key]);
      }
    }

    // Aktualisierte Einstellungen laden
    const rows = queryAll<{ key: string; value: string }>('SELECT key, value FROM settings');

    const settings: Record<string, string | number> = {};
    for (const row of rows) {
      if (['surcharge_first_night', 'price_per_dog_night', 'min_nights'].includes(row.key)) {
        settings[row.key] = parseFloat(row.value);
      } else {
        settings[row.key] = row.value;
      }
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Einstellungen:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Aktualisieren der Einstellungen'
    });
  }
});

export default router;
