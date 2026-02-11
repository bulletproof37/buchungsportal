import { useMemo } from 'react';
import { LABELS } from '../../utils/constants';
import { calculatePrice, formatPrice } from '../../utils/pricing';
import { calculateNights } from '../../utils/dateUtils';

interface PriceCalculationProps {
  checkIn: string | undefined;
  checkOut: string | undefined;
  pricePerNight: number;
  dogCount: number;
  surchargeFirstNight: number;
  pricePerDogNight: number;
}

export default function PriceCalculation({
  checkIn,
  checkOut,
  pricePerNight,
  dogCount,
  surchargeFirstNight,
  pricePerDogNight
}: PriceCalculationProps) {
  const calculation = useMemo(() => {
    if (!checkIn || !checkOut || !pricePerNight) {
      return null;
    }

    const nights = calculateNights(checkIn, checkOut);
    if (nights < 1) {
      return null;
    }

    return {
      nights,
      ...calculatePrice({
        pricePerNight,
        nights,
        dogCount: dogCount || 0,
        surchargeFirstNight,
        pricePerDogNight
      })
    };
  }, [checkIn, checkOut, pricePerNight, dogCount, surchargeFirstNight, pricePerDogNight]);

  if (!calculation) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-gray-500 text-sm text-center">
          Bitte Anreise- und Abreisedatum wählen, um den Preis zu berechnen.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <h4 className="font-semibold text-gray-900 mb-3">{LABELS.TOTAL_PRICE}</h4>

      <div className="space-y-2 text-sm">
        {/* Anzahl Nächte */}
        <div className="flex justify-between text-gray-600">
          <span>{LABELS.NIGHTS}:</span>
          <span className="font-medium">{calculation.nights}</span>
        </div>

        <hr className="border-blue-200" />

        {/* Grundpreis */}
        <div className="flex justify-between text-gray-600">
          <span>{formatPrice(pricePerNight)} × {calculation.nights} {LABELS.NIGHTS}</span>
          <span>{formatPrice(calculation.basePrice)}</span>
        </div>

        {/* Aufpreis erste Nacht */}
        <div className="flex justify-between text-gray-600">
          <span>{LABELS.SURCHARGE_FIRST_NIGHT}</span>
          <span>{formatPrice(calculation.surchargeFirstNight)}</span>
        </div>

        {/* Hundekosten */}
        {calculation.dogCosts > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>{LABELS.DOG_COSTS} ({dogCount} × {formatPrice(pricePerDogNight)} × {calculation.nights})</span>
            <span>{formatPrice(calculation.dogCosts)}</span>
          </div>
        )}

        <hr className="border-blue-300" />

        {/* Gesamtpreis */}
        <div className="flex justify-between text-lg font-bold text-gray-900">
          <span>{LABELS.TOTAL_PRICE}</span>
          <span className="text-blue-700">{formatPrice(calculation.totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
