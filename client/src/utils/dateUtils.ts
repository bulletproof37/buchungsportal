import { LABELS } from './constants';

/**
 * Berechnet die Anzahl der Nächte zwischen zwei Daten
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Formatiert ein Datum im deutschen Format (TT.MM.JJJJ)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatiert ein Datum kurz (TT.MM.)
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit'
  });
}

/**
 * Gibt das ISO-Datum (YYYY-MM-DD) zurück
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Prüft ob ein Datum ein Wochenende ist (Samstag oder Sonntag)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Gibt den Monatsnamen zurück
 */
export function getMonthName(monthIndex: number): string {
  return LABELS.MONTHS[monthIndex];
}

/**
 * Gibt den Wochentag-Namen zurück
 */
export function getWeekdayName(date: Date, long: boolean = false): string {
  const day = date.getDay();
  return long ? LABELS.WEEKDAYS_LONG[day] : LABELS.WEEKDAYS[day];
}

/**
 * Erstellt ein Array aller Tage eines Jahres
 */
export function getDaysInYear(year: number): Date[] {
  const days: Date[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Gibt die Anzahl der Tage im Jahr zurück
 */
export function getDaysCountInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Prüft ob ein Jahr ein Schaltjahr ist
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Prüft ob zwei Zeiträume überlappen (unter Berücksichtigung der Halbtage-Logik)
 * Abreise am Tag X (vormittags) + Anreise am Tag X (nachmittags) = ERLAUBT
 */
export function doPeriodsOverlap(
  checkIn1: string,
  checkOut1: string,
  checkIn2: string,
  checkOut2: string
): boolean {
  // Wenn Abreise von Buchung 1 = Anreise von Buchung 2, dann KEINE Überschneidung
  // (weil Abreise vormittags und Anreise nachmittags)
  if (checkOut1 === checkIn2 || checkOut2 === checkIn1) {
    return false;
  }

  const start1 = new Date(checkIn1).getTime();
  const end1 = new Date(checkOut1).getTime();
  const start2 = new Date(checkIn2).getTime();
  const end2 = new Date(checkOut2).getTime();

  return start1 < end2 && start2 < end1;
}

/**
 * Prüft ob ein Datum in einem Zeitraum liegt
 */
export function isDateInRange(date: Date, checkIn: string, checkOut: string): boolean {
  const dateTime = date.getTime();
  const startTime = new Date(checkIn).getTime();
  const endTime = new Date(checkOut).getTime();
  return dateTime >= startTime && dateTime < endTime;
}

/**
 * Gibt den ersten Tag eines Monats zurück
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * Gibt den letzten Tag eines Monats zurück
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}
