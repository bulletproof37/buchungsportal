import { BookingInput, ValidationError, Booking } from '../types';
import { ERRORS, DEFAULTS } from './constants';
import { calculateNights, doPeriodsOverlap } from './dateUtils';

/**
 * Validiert eine Buchungs-Eingabe
 */
export function validateBooking(
  input: Partial<BookingInput>,
  existingBookings: Booking[],
  editingBookingId?: number,
  minNights: number = DEFAULTS.MIN_NIGHTS
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Pflichtfelder prüfen
  if (!input.house_id) {
    errors.push({ field: 'house_id', message: ERRORS.REQUIRED_FIELD });
  }

  if (!input.check_in) {
    errors.push({ field: 'check_in', message: ERRORS.REQUIRED_FIELD });
  }

  if (!input.check_out) {
    errors.push({ field: 'check_out', message: ERRORS.REQUIRED_FIELD });
  }

  if (!input.guest_last_name?.trim()) {
    errors.push({ field: 'guest_last_name', message: ERRORS.REQUIRED_FIELD });
  }

  if (!input.status) {
    errors.push({ field: 'status', message: ERRORS.REQUIRED_FIELD });
  }

  // Datums-Validierung
  if (input.check_in && input.check_out) {
    const checkInDate = new Date(input.check_in);
    const checkOutDate = new Date(input.check_out);

    // Abreise nach Anreise
    if (checkOutDate <= checkInDate) {
      errors.push({ field: 'check_out', message: ERRORS.CHECK_OUT_BEFORE_CHECK_IN });
    } else {
      // Mindestaufenthalt
      const nights = calculateNights(input.check_in, input.check_out);
      if (nights < minNights) {
        errors.push({ field: 'check_out', message: ERRORS.MIN_NIGHTS(minNights) });
      }
    }

    // Überschneidungsprüfung (nur wenn Haus ausgewählt)
    if (input.house_id) {
      const overlappingBooking = existingBookings.find(booking => {
        // Eigene Buchung beim Bearbeiten ignorieren
        if (editingBookingId && booking.id === editingBookingId) {
          return false;
        }
        // Nur Buchungen desselben Hauses prüfen
        if (booking.house_id !== input.house_id) {
          return false;
        }
        // Überschneidung prüfen (mit Halbtage-Logik)
        return doPeriodsOverlap(
          input.check_in!,
          input.check_out!,
          booking.check_in,
          booking.check_out
        );
      });

      if (overlappingBooking) {
        errors.push({ field: 'check_in', message: ERRORS.OVERLAP });
      }
    }
  }

  return errors;
}

/**
 * Prüft ob eine E-Mail-Adresse gültig ist
 */
export function isValidEmail(email: string): boolean {
  if (!email) return true; // E-Mail ist optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Prüft ob eine Telefonnummer gültig ist (einfache Prüfung)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  // Mindestens 6 Zeichen, nur Zahlen, Leerzeichen, +, -, ()
  const phoneRegex = /^[\d\s+\-()]{6,}$/;
  return phoneRegex.test(phone);
}

/**
 * Gibt den ersten Fehler für ein Feld zurück
 */
export function getFieldError(errors: ValidationError[], field: string): string | undefined {
  const error = errors.find(e => e.field === field);
  return error?.message;
}

/**
 * Prüft ob Validierungsfehler vorliegen
 */
export function hasErrors(errors: ValidationError[]): boolean {
  return errors.length > 0;
}
