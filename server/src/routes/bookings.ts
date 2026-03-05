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

// ── Timeline-PDF Hilfsfunktionen ─────────────────────────────

const MONTH_NAMES_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];
const MONTH_NAMES_ASCII = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

function numDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isWeekendDay(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month - 1, day).getDay();
  return dow === 0 || dow === 6;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawTimelinePage(
  doc: any,
  pageMonths: number[],
  year: number,
  houses: { id: number; name: string }[],
  bookings: BookingRow[],
  blocks: { id: number; house_id: number; date_from: string; date_to: string; description: string }[],
  companyName: string
): void {
  const mg = 25;
  const pageW = doc.page.width - 2 * mg;
  const x0 = mg;
  let y = mg;

  const fmtCur = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);

  // ── Seitenkopf ────────────────────────────────────────────
  const monthLabel = pageMonths.map(m => MONTH_NAMES_DE[m - 1]).join(' & ');
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
    .text(companyName, x0, y, { width: pageW * 0.55, lineBreak: false });
  doc.fontSize(10).font('Helvetica').fillColor('#555555')
    .text(`Jahresübersicht ${year}  ·  ${monthLabel}`, x0, y, { width: pageW, align: 'right', lineBreak: false });
  y += 17;
  doc.moveTo(x0, y).lineTo(x0 + pageW, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
  y += 7;

  // ── Grid-Layout ───────────────────────────────────────────
  const two = pageMonths.length === 2;
  const houseColW = two ? 62 : 80;
  const gap = two ? 6 : 0;
  const panelW = two ? (pageW - houseColW - gap) / 2 : pageW - houseColW;
  const titleH = 14;
  const dayH = 13;
  const rowH = 16;
  const gridH = titleH + dayH + houses.length * rowH;
  const gridY = y;

  // Hausnamen-Spalte
  houses.forEach((house, hi) => {
    const hy = gridY + titleH + dayH + hi * rowH;
    if (hi % 2 === 0) {
      doc.rect(x0, hy, houseColW, rowH).fill('#f8f9fa');
    }
    doc.fillColor('#333333').fontSize(6.5).font('Helvetica')
      .text(house.name, x0 + 2, hy + 5, { width: houseColW - 4, lineBreak: false, ellipsis: true });
    doc.moveTo(x0, hy + rowH).lineTo(x0 + houseColW, hy + rowH)
      .strokeColor('#e5e7eb').lineWidth(0.3).stroke();
  });
  doc.rect(x0, gridY + titleH, houseColW, dayH + houses.length * rowH)
    .lineWidth(0.4).stroke('#b0b7c3');

  // Monatspanels
  pageMonths.forEach((month, mi) => {
    const panelX = x0 + houseColW + mi * (panelW + gap);
    const nd = numDaysInMonth(year, month);
    const dw = panelW / nd;
    const monthStartDate = new Date(year, month - 1, 1);
    const nextMonthStart = new Date(year, month, 1);
    const mStr = String(month).padStart(2, '0');
    const monthStartStr = `${year}-${mStr}-01`;
    const nextMonthStr = month < 12
      ? `${year}-${String(month + 1).padStart(2, '0')}-01`
      : `${year + 1}-01-01`;

    // Monatstitel
    doc.rect(panelX, gridY, panelW, titleH).fill('#dde3ee');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111111')
      .text(MONTH_NAMES_DE[month - 1], panelX, gridY + 3, { width: panelW, align: 'center', lineBreak: false });

    // Tagesnummern-Zeile
    for (let d = 1; d <= nd; d++) {
      const dx = panelX + (d - 1) * dw;
      const we = isWeekendDay(year, month, d);
      doc.rect(dx, gridY + titleH, dw, dayH).fill(we ? '#e9ecf0' : '#f5f6f8');
      doc.fontSize(6).font('Helvetica').fillColor(we ? '#888888' : '#444444')
        .text(String(d), dx, gridY + titleH + 4, { width: dw, align: 'center', lineBreak: false });
    }

    // Hauszeilen
    houses.forEach((house, hi) => {
      const hy = gridY + titleH + dayH + hi * rowH;

      // Zeilenhintergrund + Wochenend-Spalten
      for (let d = 1; d <= nd; d++) {
        const dx = panelX + (d - 1) * dw;
        const we = isWeekendDay(year, month, d);
        if (we) {
          doc.rect(dx, hy, dw, rowH).fill(hi % 2 === 0 ? '#e9ecf0' : '#e4e8ef');
        } else if (hi % 2 !== 0) {
          doc.rect(dx, hy, dw, rowH).fill('#fafafa');
        }
        doc.moveTo(dx, hy).lineTo(dx, hy + rowH)
          .strokeColor('#e0e4ea').lineWidth(0.2).stroke();
      }
      doc.moveTo(panelX, hy + rowH).lineTo(panelX + panelW, hy + rowH)
        .strokeColor('#d1d5db').lineWidth(0.3).stroke();

      // Buchungsbalken
      bookings
        .filter(b => b.house_id === house.id && b.check_in < nextMonthStr && b.check_out > monthStartStr)
        .forEach(b => {
          const ci = new Date(b.check_in + 'T12:00:00');
          const co = new Date(b.check_out + 'T12:00:00');
          const lf = ci < monthStartDate ? 0 : ci.getDate() - 0.5;
          const rf = co.getTime() >= nextMonthStart.getTime() ? nd : co.getDate() - 0.5;
          const bx = panelX + lf * dw;
          const bw2 = (rf - lf) * dw;
          if (bw2 <= 0) return;
          const by = hy + 2; const bh = rowH - 4;
          const isBook = b.status === 'booking';
          doc.rect(bx, by, bw2, bh).fill(isBook ? '#3b82f6' : '#f59e0b');
          doc.rect(bx, by, bw2, bh).lineWidth(0.5).stroke('#00000022');
          if (bw2 > 14) {
            const name = [b.guest_first_name, b.guest_last_name].filter(Boolean).join(' ');
            doc.fontSize(5.5).font('Helvetica').fillColor(isBook ? '#ffffff' : '#1c1917')
              .text(name, bx + 1.5, by + 2.5, { width: bw2 - 3, lineBreak: false, ellipsis: true });
          }
        });

      // Sperrzeiten-Balken
      blocks
        .filter(bl => bl.house_id === house.id && bl.date_from < nextMonthStr && bl.date_to > monthStartStr)
        .forEach(bl => {
          const bf = new Date(bl.date_from + 'T12:00:00');
          const bt = new Date(bl.date_to + 'T12:00:00');
          const lf = bf < monthStartDate ? 0 : bf.getDate() - 1;
          const rf = bt.getTime() >= nextMonthStart.getTime() ? nd : bt.getDate() - 1;
          const bx = panelX + lf * dw;
          const bw2 = (rf - lf) * dw;
          if (bw2 <= 0) return;
          const by = hy + 2; const bh = rowH - 4;
          doc.rect(bx, by, bw2, bh).fill('#9ca3af');
          doc.rect(bx, by, bw2, bh).lineWidth(0.5).stroke('#00000022');
          if (bw2 > 14 && bl.description) {
            doc.fontSize(5.5).font('Helvetica').fillColor('#1f2937')
              .text(bl.description, bx + 1.5, by + 2.5, { width: bw2 - 3, lineBreak: false, ellipsis: true });
          }
        });
    });

    // Panel-Rahmen
    doc.rect(panelX, gridY, panelW, gridH).lineWidth(0.5).stroke('#aaaaaa');
  });

  y = gridY + gridH + 10;

  // ── Buchungsliste ─────────────────────────────────────────
  doc.moveTo(x0, y).lineTo(x0 + pageW, y).strokeColor('#cccccc').lineWidth(0.5).stroke();
  y += 7;
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
    .text('Buchungen & Reservierungen', x0, y, { lineBreak: false });
  y += 13;

  // Relevante Buchungen für diese Seite
  const relevant = bookings.filter(b =>
    pageMonths.some(month => {
      const mStr2 = String(month).padStart(2, '0');
      const mStart = `${year}-${mStr2}-01`;
      const mEnd = month < 12
        ? `${year}-${String(month + 1).padStart(2, '0')}-01`
        : `${year + 1}-01-01`;
      return b.check_in < mEnd && b.check_out > mStart;
    })
  );

  // Tabellenspalten
  const c = {
    h: { x: x0, w: 95 },
    g: { x: x0 + 95, w: 125 },
    i: { x: x0 + 220, w: 72 },
    o: { x: x0 + 292, w: 72 },
    n: { x: x0 + 364, w: 45 },
    s: { x: x0 + 409, w: 82 },
    p: { x: x0 + 491, w: pageW - 491 },
  };

  doc.rect(x0, y, pageW, 13).fill('#dde3ee');
  doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Ferienhaus', c.h.x + 2, y + 3, { width: c.h.w, lineBreak: false });
  doc.text('Gast', c.g.x + 2, y + 3, { width: c.g.w, lineBreak: false });
  doc.text('Anreise', c.i.x + 2, y + 3, { width: c.i.w, lineBreak: false });
  doc.text('Abreise', c.o.x + 2, y + 3, { width: c.o.w, lineBreak: false });
  doc.text('Nächte', c.n.x + 2, y + 3, { width: c.n.w, lineBreak: false });
  doc.text('Status', c.s.x + 2, y + 3, { width: c.s.w, lineBreak: false });
  doc.text('Gesamtpreis', c.p.x + 2, y + 3, { width: c.p.w, align: 'right', lineBreak: false });
  y += 13;

  if (relevant.length === 0) {
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
      .text('Keine Buchungen in diesem Zeitraum.', x0, y + 4, { lineBreak: false });
  } else {
    relevant.forEach((b, idx) => {
      if (idx % 2 === 1) {
        doc.rect(x0, y, pageW, 12).fill('#f5f7fb');
      }
      const nights = calculateNights(b.check_in, b.check_out);
      const guestName = [b.guest_first_name, b.guest_last_name].filter(Boolean).join(' ');
      const isBook = b.status === 'booking';
      doc.fontSize(7).font('Helvetica').fillColor('#111111');
      doc.text(b.house_name ?? '–', c.h.x + 2, y + 3, { width: c.h.w - 4, lineBreak: false, ellipsis: true });
      doc.text(guestName, c.g.x + 2, y + 3, { width: c.g.w - 4, lineBreak: false, ellipsis: true });
      doc.text(formatDateDE(b.check_in), c.i.x + 2, y + 3, { width: c.i.w - 4, lineBreak: false });
      doc.text(formatDateDE(b.check_out), c.o.x + 2, y + 3, { width: c.o.w - 4, lineBreak: false });
      doc.text(String(nights), c.n.x + 2, y + 3, { width: c.n.w - 4, lineBreak: false });
      doc.fillColor(isBook ? '#1d4ed8' : '#92400e')
        .text(isBook ? 'Buchung' : 'Reservierung', c.s.x + 2, y + 3, { width: c.s.w - 4, lineBreak: false });
      doc.fillColor('#111111')
        .text(fmtCur(b.total_price), c.p.x + 2, y + 3, { width: c.p.w - 4, align: 'right', lineBreak: false });
      y += 12;
      doc.moveTo(x0, y).lineTo(x0 + pageW, y).strokeColor('#e5e7eb').lineWidth(0.3).stroke();
    });
  }
}

/**
 * GET /api/bookings/timeline-pdf?year=2026&months=1,2
 * Erstellt einen Timeline-Monats-PDF-Export (DIN A4 quer)
 */
router.get('/timeline-pdf', (req, res) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const monthsParam = (req.query.months as string) || '';
    const months = monthsParam
      .split(',')
      .map(Number)
      .filter(m => m >= 1 && m <= 12)
      .sort((a, b) => a - b);

    if (months.length === 0) {
      return res.status(400).json({ success: false, error: 'Keine Monate ausgewählt' });
    }

    const yearStr = String(year);
    const houses = queryAll<{ id: number; name: string }>('SELECT id, name FROM houses ORDER BY id');
    const bookings = queryAll<BookingRow>(`
      SELECT b.*, h.name as house_name
      FROM bookings b
      JOIN houses h ON b.house_id = h.id
      WHERE (
        strftime('%Y', b.check_in) = ? OR
        strftime('%Y', b.check_out) = ? OR
        (b.check_in < ? AND b.check_out > ?)
      )
      ORDER BY b.check_in ASC
    `, [yearStr, yearStr, `${yearStr}-01-01`, `${yearStr}-12-31`]);

    const blocks = queryAll<{ id: number; house_id: number; date_from: string; date_to: string; description: string }>(`
      SELECT * FROM blocks WHERE date_from < ? AND date_to > ? ORDER BY date_from
    `, [`${yearStr}-12-31`, `${yearStr}-01-01`]);

    const s = getAllSettings();
    const companyName = s['company_name'] ?? 'Bioferienhof Loreley GbR';

    const monthsFileLabel = months.map(m => MONTH_NAMES_ASCII[m - 1]).join('-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="timeline-${year}-${monthsFileLabel}.pdf"`);

    const doc = new PDFDocument({ margin: 0, size: 'A4', layout: 'landscape', autoFirstPage: true });
    doc.pipe(res);

    for (let i = 0; i < months.length; i += 2) {
      if (i > 0) doc.addPage();
      drawTimelinePage(doc, months.slice(i, i + 2), year, houses, bookings, blocks, companyName);
    }

    doc.end();
  } catch (error) {
    console.error('Fehler beim Erstellen des Timeline-PDFs:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Fehler beim Erstellen des Timeline-PDFs' });
    }
  }
});

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

    const filePrefix = booking.status === 'booking' ? 'buchung' : 'reservierung';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filePrefix}-${booking.id}.pdf"`);

    const doc = new PDFDocument({ margin: 55, size: 'A4' });
    doc.pipe(res);

    const pageW = doc.page.width - 110; // nutzbare Breite

    // ── Titel ganz oben ────────────────────────────────────────────
    const titleLabel = booking.status === 'booking' ? 'Buchungsbestätigung' : 'Reservierungsbestätigung';
    doc.fontSize(20).font('Helvetica-Bold')
      .text(titleLabel, { align: 'center' });
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

    if (booking.status === 'reservation') {
      doc.fontSize(10).font('Helvetica')
        .text('Wir bitten um Anzahlung von 100 € innerhalb von 4 Tagen auf folgendes Konto unter Angabe von Anzahlung, Hausname, Zeitraum und Name, alternativ können Sie auch bereits den Gesamtbetrag überweisen.');
    } else {
      doc.fontSize(10).font('Helvetica')
        .text('Wir bitten um Überweisung der Restzahlung bis spätestens 4 Wochen vor Anreise auf folgendes Konto:');
    }

    doc.moveDown(0.6);
    doc.fontSize(10).font('Helvetica-Bold').text('Bankverbindung:');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica')
      .text('Svenja Stefanie Mareen Bahl');
    doc.text('IBAN: DE04 1001 1001 2758 3417 94');
    doc.text('BIC: NTSBDEB1XXX  ·  N26 Bank');

    doc.moveDown(0.8);
    doc.fontSize(10).font('Helvetica-Bold').text('Vor Ort ist zusätzlich zu entrichten:');
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica')
      .text('Bettwäsche je Person  6,00 €  (wenn gewünscht)');
    doc.text('ggf. Hund  5,00 €  / Nacht');

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
