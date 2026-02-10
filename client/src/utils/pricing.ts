import { DEFAULTS } from './constants';

interface PriceCalculationInput {
  pricePerNight: number;
  nights: number;
  dogCount: number;
  surchargeFirstNight?: number;
  pricePerDogNight?: number;
}

interface PriceCalculationResult {
  basePrice: number;        // Nachtpreis × Nächte
  surchargeFirstNight: number;
  dogCosts: number;         // Hunde × Preis × Nächte
  totalPrice: number;
}

/**
 * Berechnet den Gesamtpreis einer Buchung
 * Formel: (Nachtpreis × Nächte) + Aufpreis erste Nacht + (Hunde × 5€ × Nächte)
 */
export function calculatePrice(input: PriceCalculationInput): PriceCalculationResult {
  const {
    pricePerNight,
    nights,
    dogCount,
    surchargeFirstNight = DEFAULTS.SURCHARGE_FIRST_NIGHT,
    pricePerDogNight = DEFAULTS.PRICE_PER_DOG_NIGHT
  } = input;

  const basePrice = pricePerNight * nights;
  const dogCosts = dogCount * pricePerDogNight * nights;
  const totalPrice = basePrice + surchargeFirstNight + dogCosts;

  return {
    basePrice,
    surchargeFirstNight,
    dogCosts,
    totalPrice
  };
}

/**
 * Formatiert einen Preis für die Anzeige (deutsches Format)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

/**
 * Formatiert einen Preis ohne Währungssymbol
 */
export function formatPriceShort(price: number): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price) + ' €';
}
