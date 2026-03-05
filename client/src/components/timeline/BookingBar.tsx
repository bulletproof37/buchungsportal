import { Booking } from '../../types';
import { calculateNights } from '../../utils/dateUtils';

interface BookingBarProps {
  booking: Booking;
  dayWidth: number;
  yearStart: Date;
  yearEnd: Date;
  onClick?: (booking: Booking) => void;
}

export default function BookingBar({
  booking,
  dayWidth,
  yearStart,
  yearEnd,
  onClick
}: BookingBarProps) {
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);

  // Begrenze auf das aktuelle Jahr
  const displayStart = checkIn < yearStart ? yearStart : checkIn;
  const displayEnd = checkOut > yearEnd ? yearEnd : checkOut;

  // Berechne Position und Breite
  const startDayOfYear = Math.floor(
    (displayStart.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const endDayOfYear = Math.floor(
    (displayEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Halbtage-Logik:
  // - Anreise beginnt in der rechten Hälfte des Tages (Nachmittag)
  // - Abreise endet in der linken Hälfte des Tages (Vormittag)
  const startsThisYear = checkIn >= yearStart;
  const endsThisYear = checkOut <= yearEnd;

  // Position: Start bei der rechten Hälfte des Anreisetags (außer Buchung beginnt vor dem Jahr)
  const leftOffset = startsThisYear
    ? startDayOfYear * dayWidth + dayWidth / 2
    : startDayOfYear * dayWidth;

  // Breite: Ende bei der linken Hälfte des Abreisetags (außer Buchung endet nach dem Jahr)
  const rightEnd = endsThisYear
    ? endDayOfYear * dayWidth + dayWidth / 2
    : (endDayOfYear + 1) * dayWidth;

  const width = rightEnd - leftOffset;

  // Farbe je nach Status
  const bgColor = booking.status === 'booking'
    ? 'bg-booking hover:bg-booking-dark'
    : 'bg-reservation hover:bg-reservation-dark';

  const handleClick = () => {
    onClick?.(booking);
  };

  return (
    <div
      className={`absolute top-1 bottom-1 ${bgColor} rounded text-white text-xs font-medium px-1 truncate flex items-center cursor-pointer transition-colors shadow-sm border border-black/20`}
      style={{
        left: leftOffset,
        width: Math.max(width, 20)
      }}
      onClick={handleClick}
      title={`${booking.guest_last_name} (${calculateNights(booking.check_in, booking.check_out)} Nächte)`}
    >
      <span className="truncate">{booking.guest_last_name}</span>
    </div>
  );
}
