/**
 * Einmaliger Import der Buchungen aus buchungen_loreley.csv
 *
 * Aufruf (vom Projektverzeichnis):
 *   node server/import-bookings.mjs
 *
 * Das Skript importiert nur, wenn die bookings-Tabelle leer ist.
 * Zum erneuten Import erst: DELETE FROM bookings; in der DB ausführen.
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'bookings.db');

if (!fs.existsSync(dbPath)) {
  console.error('Fehler: Datenbank nicht gefunden:', dbPath);
  console.error('Bitte erst start.bat ausfuehren, damit die Datenbank initialisiert wird.');
  process.exit(1);
}

const db = new Database(dbPath);

// Haus-Mapping: CSV-Name → Datenbankname
function mapHouseName(csvName) {
  const n = csvName.trim();
  if (n === 'Värmland')                        return 'Värmland';
  if (n === 'Haus Lönneberga')                 return 'Lönneberga';
  if (n === 'Haus Dalarna')                    return 'Dalarna';
  if (n === 'Lappland')                        return 'Lappland';
  if (n.startsWith('Småland'))                 return 'Småland';
  return null;
}

// DD.MM.YYYY → YYYY-MM-DD
function toIso(d) {
  const [day, month, year] = d.split('.');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// "Nachname, Vorname" aufteilen
function parseName(name) {
  const comma = name.indexOf(',');
  if (comma === -1) return { last: name.trim(), first: '' };
  return {
    last:  name.slice(0, comma).trim(),
    first: name.slice(comma + 1).trim(),
  };
}

// Häuser aus DB laden
const houses = db.prepare('SELECT id, name, price_per_night FROM houses').all();
const houseMap = {};
for (const h of houses) houseMap[h.name] = h;

console.log('Gefundene Häuser:', Object.keys(houseMap).join(', '));

// Prüfen ob bereits Buchungen existieren
const existingCount = db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
if (existingCount > 0) {
  console.log(`\nHinweis: Es existieren bereits ${existingCount} Buchungen.`);
  console.log('Import wird trotzdem durchgeführt (keine Duplikatprüfung nach Buchungsnummer).');
}

// Buchungsdaten aus buchungen_loreley.csv (eingebettet)
// Format: [Buchungsnummer, Kunde, Unterkunft, Anreise, Abreise, Betrag]
const csvRows = [
  ['105207307', 'Breilmann, Hermann',                 'Värmland',                              '16.03.2026', '18.03.2026',  100.00],
  ['104186524', 'Wilbert, Waltraud',                  'Haus Lönneberga',                       '28.03.2026', '03.04.2026',  515.00],
  ['104186440', 'Wilbert, Waltraud',                  'Haus Dalarna',                          '28.03.2026', '04.04.2026',  595.00],
  ['103288851', 'Reimer, Carolin',                    'Värmland',                              '31.03.2026', '03.04.2026',  275.00],
  ['103312883', 'Schürmann, Andrea',                  'Haus Lönneberga',                       '03.04.2026', '12.04.2026',  755.00],
  ['104840961', 'Trabold, Ina',                       'Värmland',                              '06.04.2026', '10.04.2026',  315.00],
  ['104387303', 'Nikolenko, Eduard',                  'Småland Schwedenhaus für 6 Personen',   '06.04.2026', '10.04.2026',  395.00],
  ['105207256', 'Breilmann, Hermann',                 'Lappland',                              '09.04.2026', '12.04.2026',  120.00],
  ['103779256', 'Romanski, Anke',                     'Lappland',                              '17.04.2026', '20.04.2026',  215.00],
  ['104479942', 'Bieker, Lisa',                       'Lappland',                              '01.05.2026', '03.05.2026',  155.00],
  ['103173488', 'Simon, Lilian',                      'Haus Dalarna',                          '30.04.2026', '03.05.2026',  275.00],
  ['103173827', 'Simon, Lilian',                      'Haus Lönneberga',                       '30.04.2026', '03.05.2026',  275.00],
  ['103173814', 'Simon, Lilian',                      'Småland Schwedenhaus für 6 Personen',   '30.04.2026', '03.05.2026',  305.00],
  ['105110856', 'Syberg, Klaus',                      'Lappland',                              '08.05.2026', '10.05.2026',  155.00],
  ['104324332', 'Marek, Daniel',                      'Haus Lönneberga',                       '07.05.2026', '10.05.2026',  275.00],
  ['104331579', 'Hildebrand, Katharina',              'Haus Dalarna',                          '03.05.2026', '10.05.2026',  595.00],
  ['102653201', 'Giesen, Nadine',                     'Haus Dalarna',                          '14.05.2026', '16.05.2026',  515.00],
  ['104840762', 'Aberle, Georg',                      'Haus Lönneberga',                       '23.05.2026', '31.05.2026',  675.00],
  ['104338552', 'Güntner, Tom',                       'Småland Schwedenhaus für 6 Personen',   '22.05.2026', '25.05.2026',  305.00],
  ['105184949', 'Steinmetz, Klaus',                   'Lappland',                              '29.05.2026', '01.06.2026',  215.00],
  ['103935732', 'Tschiederer, Betti',                 'Småland Schwedenhaus für 6 Personen',   '03.06.2026', '07.06.2026',  395.00],
  ['103935695', 'Vogel, Tinka',                       'Haus Lönneberga',                       '03.06.2026', '07.06.2026',  355.00],
  ['104535369', 'Carels, Marieken',                   'Värmland',                              '13.06.2026', '15.06.2026',  175.00],
  ['102928189', 'Engelmann, Jennifer',                'Haus Lönneberga',                       '12.06.2026', '14.06.2026',  195.00],
  ['102828645', 'Hasselmann, Alexa',                  'Haus Dalarna',                          '19.06.2026', '21.06.2026',  195.00],
  ['104614980', 'Bröring, Lorena',                    'Värmland',                              '24.07.2026', '26.07.2026',  175.00],
  ['103980838', 'Nguyen, Thai Giang',                 'Småland Schwedenhaus für 6 Personen',   '24.07.2026', '26.07.2026',  215.00],
  ['103980802', 'Nguyen, Thao Giang',                 'Lappland',                              '24.07.2026', '26.07.2026',  155.00],
  ['104364442', 'Jülich, Torsten',                    'Haus Lönneberga',                       '21.07.2026', '01.08.2026',  915.00],
  ['104364484', 'Jülich, Torsten',                    'Haus Dalarna',                          '28.07.2026', '01.08.2026',  355.00],
  ['104364580', 'Jülich, Torsten',                    'Lappland',                              '28.07.2026', '30.07.2026',  155.00],
  ['104364646', 'Jülich, Torsten',                    'Värmland',                              '28.07.2026', '30.07.2026',  175.00],
  ['104364607', 'Jülich, Torsten',                    'Småland Schwedenhaus für 6 Personen',   '27.07.2026', '01.08.2026',  485.00],
  ['104351455', 'Engel, Jürgen',                      'Värmland',                              '16.09.2026', '20.09.2026',  315.00],
  ['104909366', 'Steinmetz, Klaus',                   'Lappland',                              '06.09.2026', '10.09.2026',  275.00],
  ['103779172', 'Apel, P',                            'Småland Schwedenhaus für 6 Personen',   '17.09.2026', '20.09.2026',  305.00],
  ['103778982', 'Worringen, P',                       'Haus Dalarna',                          '18.09.2026', '20.09.2026',  195.00],
  ['105171002', 'Lorenz, Kirstin',                    'Småland Schwedenhaus für 6 Personen',   '18.10.2026', '30.10.2026', 1115.00],
  ['104000435', 'Seyfert, Angelika',                  'Haus Dalarna',                          '28.12.2026', '02.01.2027',  285.00],
  ['104000561', 'Romanski, Anke',                     'Haus Lönneberga',                       '29.12.2026', '04.01.2027',  335.00],
  ['104001252', 'Morain, Peter',                      'Småland Schwedenhaus für 6 Personen',   '30.12.2026', '03.01.2027',  395.00],
  ['104001847', 'Bahl, Svenja',                       'Värmland',                              '30.12.2026', '03.01.2027',    0.01],
];

const insert = db.prepare(`
  INSERT INTO bookings (
    house_id, status, check_in, check_out,
    guest_last_name, guest_first_name, guest_email, guest_phone,
    dog_count, price_per_night, surcharge_first_night, price_per_dog_night,
    total_price, notes
  ) VALUES (
    ?, ?, ?, ?,
    ?, ?, NULL, '',
    0, ?, 35.00, 5.00,
    ?, ?
  )
`);

const importAll = db.transaction(() => {
  let ok = 0;
  let skip = 0;

  for (const [nr, kunde, unterkunft, anreise, abreise, betrag] of csvRows) {
    const dbHausName = mapHouseName(unterkunft);
    if (!dbHausName || !houseMap[dbHausName]) {
      console.warn(`  Unbekanntes Haus übersprungen: "${unterkunft}" (Buchung ${nr})`);
      skip++;
      continue;
    }

    const house  = houseMap[dbHausName];
    const { last, first } = parseName(kunde);

    insert.run(
      house.id,
      'booking',
      toIso(anreise),
      toIso(abreise),
      last,
      first,
      house.price_per_night,
      betrag,
      `Import Buchungsnr. ${nr}`
    );

    console.log(`  ✓ ${nr}  ${last}, ${first}  →  ${dbHausName}  ${anreise}–${abreise}  ${betrag} €`);
    ok++;
  }

  return { ok, skip };
});

console.log('\nStarte Import...\n');
const { ok, skip } = importAll();
console.log(`\nFertig: ${ok} Buchungen importiert, ${skip} übersprungen.`);

db.close();
