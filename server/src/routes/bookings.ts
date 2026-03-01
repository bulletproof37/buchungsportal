import { Router } from 'express';
import { queryAll, queryOne, run } from '../db/database.js';

const router = Router();

interface BookingInput {
  house_id: number;
  status: 'reservation' | 'booking';
  check_in: string;
  check_out: string;
  guest_last_name: string;
  guest_first_name: string;
  guest_email?: string;
  guest_phone: string;
  guest_street?: string;
  guest_zip?: string;
  guest_city?: string;
  guest_count?: number;
  dog_count: number;
  price_per_night: number;
  notes?: string;
}

interface BookingRow {
  id: number;
  house_id: number;
  house_name?: string;
  status: string;
  check_in: string;
  check_out: string;
  guest_last_name: string;
  guest_first_name: string;
  guest_email: string | null;
  guest_phone: string;
  guest_street: string | null;
  guest_zip: string | null;
  guest_city: string | null;
  guest_count: number | null;
  dog_count: number;
  price_per_night: number;
  surcharge_first_night: number;
  price_per_dog_night: number;
  total_price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Berechnet den Gesamtpreis einer Buchung
 */
function calculateTotalPrice(
  pricePerNight: number,
  nights: number,
  dogCount: number,
  surchargeFirstNight: number,
  pricePerDogNight: number
): number {
  const basePrice = pricePerNight * nights;
  const dogCosts = dogCount * pricePerDogNight * nights;
  return basePrice + surchargeFirstNight + dogCosts;
}

/**
 * Berechnet die Anzahl der Nächte
 */
function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Lädt alle relevanten Einstellungen in einem einzigen SQL-Query
 */
function getSettings(): { surcharge: number; dogPrice: number; minNights: number } {
  const rows = queryAll<{ key: string; value: string }>(
    "SELECT key, value FROM settings WHERE key IN ('surcharge_first_night', 'price_per_dog_night', 'min_nights')"
  );
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    surcharge: parseFloat(map['surcharge_first_night'] ?? '35'),
    dogPrice: parseFloat(map['price_per_dog_night'] ?? '5'),
    minNights: parseInt(map['min_nights'] ?? '2'),
  };
}

/**
 * GET /api/bookings
 * Gibt alle Buchungen zurück (optional gefiltert nach Jahr)
 */
router.get('/', (req, res) => {
  try {
    const year = req.query.year as string | undefined;

    let bookings: BookingRow[];

    if (year) {
      // Buchungen die im Jahr starten, enden oder es überspannen
      bookings = queryAll<BookingRow>(`
        SELECT b.*, h.name as house_name
        FROM bookings b
        JOIN houses h ON b.house_id = h.id
        WHERE (
          strftime('%Y', b.check_in) = ? OR
          strftime('%Y', b.check_out) = ? OR
          (b.check_in < ? AND b.check_out > ?)
        )
        ORDER BY b.check_in ASC
      `, [year, year, `${year}-01-01`, `${year}-12-31`]);
    } else {
      bookings = queryAll<BookingRow>(`
        SELECT b.*, h.name as house_name
        FROM bookings b
        JOIN houses h ON b.house_id = h.id
        ORDER BY b.check_in ASC
      `);
    }

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Fehler beim Laden der Buchungen:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Buchungen'
    });
  }
});

/**
 * GET /api/bookings/:id
 * Gibt eine einzelne Buchung zurück
 */
router.get('/:id', (req, res) => {
  try {
    const booking = queryOne<BookingRow>(`
      SELECT b.*, h.name as house_name
      FROM bookings b
      JOIN houses h ON b.house_id = h.id
      WHERE b.id = ?
    `, [parseInt(req.params.id)]);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Buchung nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Fehler beim Laden der Buchung:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Buchung'
    });
  }
});

/**
 * POST /api/bookings
 * Erstellt eine neue Buchung
 */
router.post('/', (req, res) => {
  try {
    const input = req.body as BookingInput;
    const settings = getSettings();

    // Validierung
    const nights = calculateNights(input.check_in, input.check_out);
    if (nights < settings.minNights) {
      return res.status(400).json({
        success: false,
        error: `Mindestaufenthalt: ${settings.minNights} Nächte`
      });
    }

    // Überschneidungsprüfung (mit Halbtage-Logik)
    const overlapping = queryOne<{ id: number }>(`
      SELECT id FROM bookings
      WHERE house_id = ?
        AND check_in < ?
        AND check_out > ?
        AND NOT (check_out = ? OR check_in = ?)
    `, [input.house_id, input.check_out, input.check_in, input.check_in, input.check_out]);

    if (overlapping) {
      return res.status(400).json({
        success: false,
        error: 'In diesem Zeitraum ist das Ferienhaus bereits belegt'
      });
    }

    // Gesamtpreis berechnen
    const totalPrice = calculateTotalPrice(
      input.price_per_night,
      nights,
      input.dog_count || 0,
      settings.surcharge,
      settings.dogPrice
    );

    // Buchung erstellen
    const result = run(`
      INSERT INTO bookings (
        house_id, status, check_in, check_out,
        guest_last_name, guest_first_name, guest_email, guest_phone,
        guest_street, guest_zip, guest_city, guest_count,
        dog_count, price_per_night, surcharge_first_night, price_per_dog_night,
        total_price, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      input.house_id,
      input.status,
      input.check_in,
      input.check_out,
      input.guest_last_name,
      input.guest_first_name,
      input.guest_email || null,
      input.guest_phone,
      input.guest_street || null,
      input.guest_zip || null,
      input.guest_city || null,
      input.guest_count || null,
      input.dog_count || 0,
      input.price_per_night,
      settings.surcharge,
      settings.dogPrice,
      totalPrice,
      input.notes || null
    ]);

    // Erstellte Buchung laden
    const booking = queryOne<BookingRow>(`
      SELECT b.*, h.name as house_name
      FROM bookings b
      JOIN houses h ON b.house_id = h.id
      WHERE b.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Fehler beim Erstellen der Buchung:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Erstellen der Buchung'
    });
  }
});

/**
 * PUT /api/bookings/:id
 * Aktualisiert eine bestehende Buchung
 */
router.put('/:id', (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const input = req.body as BookingInput;
    const settings = getSettings();

    // Prüfen ob Buchung existiert
    const existing = queryOne<{ id: number }>('SELECT id FROM bookings WHERE id = ?', [bookingId]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Buchung nicht gefunden'
      });
    }

    // Validierung
    const nights = calculateNights(input.check_in, input.check_out);
    if (nights < settings.minNights) {
      return res.status(400).json({
        success: false,
        error: `Mindestaufenthalt: ${settings.minNights} Nächte`
      });
    }

    // Überschneidungsprüfung (eigene Buchung ausschließen)
    const overlapping = queryOne<{ id: number }>(`
      SELECT id FROM bookings
      WHERE house_id = ?
        AND id != ?
        AND check_in < ?
        AND check_out > ?
        AND NOT (check_out = ? OR check_in = ?)
    `, [input.house_id, bookingId, input.check_out, input.check_in, input.check_in, input.check_out]);

    if (overlapping) {
      return res.status(400).json({
        success: false,
        error: 'In diesem Zeitraum ist das Ferienhaus bereits belegt'
      });
    }

    // Gesamtpreis berechnen
    const totalPrice = calculateTotalPrice(
      input.price_per_night,
      nights,
      input.dog_count || 0,
      settings.surcharge,
      settings.dogPrice
    );

    // Buchung aktualisieren
    run(`
      UPDATE bookings SET
        house_id = ?,
        status = ?,
        check_in = ?,
        check_out = ?,
        guest_last_name = ?,
        guest_first_name = ?,
        guest_email = ?,
        guest_phone = ?,
        guest_street = ?,
        guest_zip = ?,
        guest_city = ?,
        guest_count = ?,
        dog_count = ?,
        price_per_night = ?,
        total_price = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      input.house_id,
      input.status,
      input.check_in,
      input.check_out,
      input.guest_last_name,
      input.guest_first_name,
      input.guest_email || null,
      input.guest_phone,
      input.guest_street || null,
      input.guest_zip || null,
      input.guest_city || null,
      input.guest_count || null,
      input.dog_count || 0,
      input.price_per_night,
      totalPrice,
      input.notes || null,
      bookingId
    ]);

    // Aktualisierte Buchung laden
    const booking = queryOne<BookingRow>(`
      SELECT b.*, h.name as house_name
      FROM bookings b
      JOIN houses h ON b.house_id = h.id
      WHERE b.id = ?
    `, [bookingId]);

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Buchung:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Aktualisieren der Buchung'
    });
  }
});

/**
 * DELETE /api/bookings/:id
 * Löscht eine Buchung
 */
router.delete('/:id', (req, res) => {
  try {
    const result = run('DELETE FROM bookings WHERE id = ?', [parseInt(req.params.id)]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Buchung nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: { deleted: true }
    });
  } catch (error) {
    console.error('Fehler beim Löschen der Buchung:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Löschen der Buchung'
    });
  }
});

export default router;
