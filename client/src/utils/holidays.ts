/**
 * Berechnet das Ostersonntag-Datum für ein gegebenes Jahr
 * Verwendet die Gaußsche Osterformel
 */
export function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month, day);
}

/**
 * Berechnet alle deutschen Feiertage (bundesweit) für ein Jahr
 */
export function getGermanHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>();
  const easter = getEasterSunday(year);

  // Feste Feiertage
  holidays.set(`${year}-01-01`, 'Neujahr');
  holidays.set(`${year}-05-01`, 'Tag der Arbeit');
  holidays.set(`${year}-10-03`, 'Tag der Deutschen Einheit');
  holidays.set(`${year}-12-25`, '1. Weihnachtsfeiertag');
  holidays.set(`${year}-12-26`, '2. Weihnachtsfeiertag');

  // Bewegliche Feiertage (abhängig von Ostern)
  // Karfreitag: 2 Tage vor Ostersonntag
  const karfreitag = new Date(easter);
  karfreitag.setDate(easter.getDate() - 2);
  holidays.set(formatDateKey(karfreitag), 'Karfreitag');

  // Ostermontag: 1 Tag nach Ostersonntag
  const ostermontag = new Date(easter);
  ostermontag.setDate(easter.getDate() + 1);
  holidays.set(formatDateKey(ostermontag), 'Ostermontag');

  // Christi Himmelfahrt: 39 Tage nach Ostersonntag
  const himmelfahrt = new Date(easter);
  himmelfahrt.setDate(easter.getDate() + 39);
  holidays.set(formatDateKey(himmelfahrt), 'Christi Himmelfahrt');

  // Pfingstmontag: 50 Tage nach Ostersonntag
  const pfingstmontag = new Date(easter);
  pfingstmontag.setDate(easter.getDate() + 50);
  holidays.set(formatDateKey(pfingstmontag), 'Pfingstmontag');

  // Rheinland-Pfalz spezifische Feiertage (optional, aber im Architekturplan erwähnt)
  // Fronleichnam: 60 Tage nach Ostersonntag
  const fronleichnam = new Date(easter);
  fronleichnam.setDate(easter.getDate() + 60);
  holidays.set(formatDateKey(fronleichnam), 'Fronleichnam');

  // Allerheiligen: 1. November
  holidays.set(`${year}-11-01`, 'Allerheiligen');

  return holidays;
}

/**
 * Formatiert ein Datum als YYYY-MM-DD String
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Prüft ob ein Datum ein Feiertag ist
 */
export function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const holidays = getGermanHolidays(year);
  return holidays.has(formatDateKey(date));
}

/**
 * Gibt den Namen des Feiertags zurück (oder undefined)
 */
export function getHolidayName(date: Date): string | undefined {
  const year = date.getFullYear();
  const holidays = getGermanHolidays(year);
  return holidays.get(formatDateKey(date));
}

/**
 * Prüft ob ein Datum ein Wochenende oder Feiertag ist
 */
export function isWeekendOrHoliday(date: Date): boolean {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  return isWeekend || isHoliday(date);
}
