import { Router } from 'express';
import PDFDocument from 'pdfkit';
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
 * Formatiert ein ISO-Datum (YYYY-MM-DD) auf Deutsch (TT.MM.JJJJ)
 */
function formatDateDE(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Lädt alle Einstellungen als Key-Value-Map
 */
function getAllSettings(): Record<string, string> {
  const rows = queryAll<{ key: string; value: string }>('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

/**
 * GET /api/bookings/:id/pdf
 * Erzeugt ein PDF für eine Buchung
 */
router.get('/:id/pdf', (req, res) => {
  try {
    const booking = queryOne<BookingRow>(`
      SELECT b.*, h.name as house_name
      FROM bookings b
      JOIN houses h ON b.house_id = h.id
      WHERE b.id = ?
    `, [parseInt(req.params.id)]);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Buchung nicht gefunden' });
    }

    const s = getAllSettings();
    const companyName  = s['company_name']    ?? 'Bioferienhof Loreley GbR';
    const companyAddr  = s['company_address'] ?? '';
    const companyZip   = s['company_zip']     ?? '';
    const companyCity  = s['company_city']    ?? '';
    const companyPhone = s['company_phone']   ?? '';
    const companyMobile= s['company_mobile']  ?? '';
    const companyEmail = s['company_email']   ?? '';

    const nights = calculateNights(booking.check_in, booking.check_out);
    const vatAmount = booking.total_price * 7 / 107;
    const statusLabel = booking.status === 'booking' ? 'Buchung' : 'Reservierung';
    const today = new Date();
    const todayDE = `${String(today.getDate()).padStart(2,'0')}.${String(today.getMonth()+1).padStart(2,'0')}.${today.getFullYear()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="buchung-${booking.id}.pdf"`);

    const doc = new PDFDocument({ margin: 55, size: 'A4' });
    doc.pipe(res);

    const pageW = doc.page.width - 110; // nutzbare Breite

    // ── Titel ganz oben ────────────────────────────────────────────
    doc.fontSize(20).font('Helvetica-Bold')
      .text('Buchungsbestätigung', { align: 'center' });
    doc.fontSize(11).font('Helvetica')
      .text(`#${booking.id}  ·  ${statusLabel}`, { align: 'center' });

    doc.moveDown(1.5);
    doc.moveTo(55, doc.y).lineTo(55 + pageW, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    // ── Firmen-Info + Datum (unterhalb Titel) ──────────────────────
    const contactParts: string[] = [];
    if (companyPhone)  contactParts.push(`Tel: ${companyPhone}`);
    if (companyMobile) contactParts.push(`Mobil: ${companyMobile}`);
    if (companyEmail)  contactParts.push(companyEmail);

    // Linke Spalte: Firmenname + Adresse
    const infoY = doc.y;
    doc.fontSize(11).font('Helvetica-Bold').text(companyName, 55, infoY, { width: pageW * 0.6 });
    doc.fontSize(10).font('Helvetica');
    if (companyAddr) doc.text(companyAddr, 55, doc.y, { width: pageW * 0.6 });
    if (companyZip || companyCity) doc.text(`${companyZip} ${companyCity}`.trim(), 55, doc.y, { width: pageW * 0.6 });
    if (contactParts.length) doc.text(contactParts.join('  ·  '), 55, doc.y, { width: pageW * 0.6 });
    const leftColEndY = doc.y; // unteres Ende der linken Spalte

    // Rechte Spalte: Datum (absolut positioniert auf Höhe infoY)
    doc.fontSize(10).font('Helvetica')
      .text(`Datum: ${todayDE}`, 55, infoY, { width: pageW, align: 'right' });

    // doc.y nach der rechten Spalte ist nur 1 Zeile tief — linke Spalte ist länger
    // → auf das untere Ende der längeren Spalte setzen
    doc.y = Math.max(leftColEndY, doc.y) + 18;

    doc.moveTo(55, doc.y).lineTo(55 + pageW, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    // ── Ferienhaus & Zeitraum ──────────────────────────────────────
    const col2 = 200;
    const rowH  = 18;

    const row = (label: string, value: string) => {
      const y = doc.y;
      doc.fontSize(10).font('Helvetica-Bold').text(label, 55, y, { width: col2 - 10 });
      doc.fontSize(10).font('Helvetica').text(value, col2, y, { width: pageW - col2 + 55 });
      doc.y = y + rowH;
    };

    row('Ferienhaus:', booking.house_name ?? '–');
    row('Anreise:', formatDateDE(booking.check_in));
    row('Abreise:', formatDateDE(booking.check_out));
    row('Aufenthalt:', `${nights} ${nights === 1 ? 'Nacht' : 'Nächte'}`);
    if (booking.dog_count > 0) row('Hunde:', `${booking.dog_count}`);
    if (booking.guest_count) row('Personen:', `${booking.guest_count}`);

    doc.moveDown(1);
    doc.moveTo(55, doc.y).lineTo(55 + pageW, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    // ── Gastdaten ──────────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('Gast');
    doc.moveDown(0.4);

    const guestName = [booking.guest_first_name, booking.guest_last_name].filter(Boolean).join(' ');
    if (guestName) row('Name:', guestName);
    if (booking.guest_street) row('Straße:', booking.guest_street);
    if (booking.guest_zip || booking.guest_city)
      row('Ort:', `${booking.guest_zip ?? ''} ${booking.guest_city ?? ''}`.trim());
    if (booking.guest_phone) row('Telefon:', booking.guest_phone);
    if (booking.guest_email) row('E-Mail:', booking.guest_email);

    doc.moveDown(1);
    doc.moveTo(55, doc.y).lineTo(55 + pageW, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    // ── Preisübersicht ─────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').text('Preisübersicht');
    doc.moveDown(0.4);

    const fmt = (n: number) =>
      new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

    const priceRow = (label: string, value: string, bold = false) => {
      const y = doc.y;
      doc.fontSize(10).font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(label, 55, y, { width: pageW - 100 });
      doc.fontSize(10).font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .text(value, 55, y, { width: pageW, align: 'right' });
      doc.y = y + rowH;
    };

    priceRow(
      `Nachtpreis (${fmt(booking.price_per_night)} × ${nights} ${nights === 1 ? 'Nacht' : 'Nächte'})`,
      fmt(booking.price_per_night * nights)
    );
    priceRow(`Aufpreis erste Nacht`, fmt(booking.surcharge_first_night));
    if (booking.dog_count > 0) {
      priceRow(
        `Hundekosten (${booking.dog_count} × ${fmt(booking.price_per_dog_night)} × ${nights})`,
        fmt(booking.dog_count * booking.price_per_dog_night * nights)
      );
    }

    doc.moveDown(0.3);
    doc.moveTo(55, doc.y).lineTo(55 + pageW, doc.y).strokeColor('#999999').stroke();
    doc.moveDown(0.5);

    priceRow('Gesamtpreis (brutto)', fmt(booking.total_price), true);

    doc.fontSize(9).font('Helvetica').fillColor('#888888');
    const vatY = doc.y;
    doc.text(`davon MwSt. 7 %`, 55, vatY, { width: pageW - 100 });
    doc.text(fmt(vatAmount), 55, vatY, { width: pageW, align: 'right' });
    doc.fillColor('#000000');

    // ── Zahlungs- und Vor-Ort-Hinweise ────────────────────────────
    doc.moveDown(1.5);
    doc.moveTo(55, doc.y).lineTo(55 + pageW, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica')
      .text('Wir bitten um Überweisung der Restzahlung bis spätestens 4 Wochen vor Anreise.');

    doc.moveDown(0.8);
    doc.fontSize(10).font('Helvetica-Bold').text('Vor Ort ist zusätzlich zu entrichten:');
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica')
      .text('Bettwäsche je Person  6,00 €  (wenn gewünscht)');

    if (booking.notes) {
      doc.moveDown(1.5);
      doc.moveTo(55, doc.y).lineTo(55 + pageW, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(1);
      doc.fontSize(12).font('Helvetica-Bold').text('Notizen');
      doc.moveDown(0.4);
      doc.fontSize(10).font('Helvetica').text(booking.notes);
    }

    // ── Footer ─────────────────────────────────────────────────────
    doc.fontSize(9).font('Helvetica').fillColor('#aaaaaa')
      .text(`Buchung #${booking.id}  ·  Erstellt am ${todayDE}  ·  ${companyName}`,
        55, doc.page.height - 50, { width: pageW, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Fehler beim Erstellen des PDFs:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Fehler beim Erstellen des PDFs' });
    }
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
