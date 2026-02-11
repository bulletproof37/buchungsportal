import { useMemo } from 'react';
import { House, Booking } from '../../types';
import { getDaysInYear } from '../../utils/dateUtils';
import DayCell from './DayCell';
import BookingBar from './BookingBar';

interface HouseRowProps {
  house: House;
  year: number;
  bookings: Booking[];
  dayWidth: number;
  onDayClick?: (house: House, date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
}

export default function HouseRow({
  house,
  year,
  bookings,
  dayWidth,
  onDayClick,
  onBookingClick
}: HouseRowProps) {
  const days = useMemo(() => getDaysInYear(year), [year]);

  const yearStart = useMemo(() => new Date(year, 0, 1), [year]);
  const yearEnd = useMemo(() => new Date(year, 11, 31, 23, 59, 59), [year]);

  // Filtere Buchungen für dieses Haus
  const houseBookings = useMemo(() => {
    return bookings.filter(b => b.house_id === house.id);
  }, [bookings, house.id]);

  const handleDayClick = (date: Date) => {
    onDayClick?.(house, date);
  };

  return (
    <div className="flex border-b border-gray-200 h-10">
      {/* Tageszellen Container */}
      <div className="relative flex h-full">
        {/* Hintergrund-Zellen für Wochenenden/Feiertage */}
        {days.map((date, index) => (
          <DayCell
            key={index}
            date={date}
            dayWidth={dayWidth}
            onDayClick={() => handleDayClick(date)}
          />
        ))}

        {/* Buchungsbalken (absolute positioniert) */}
        {houseBookings.map(booking => (
          <BookingBar
            key={booking.id}
            booking={booking}
            dayWidth={dayWidth}
            yearStart={yearStart}
            yearEnd={yearEnd}
            onClick={onBookingClick}
          />
        ))}
      </div>
    </div>
  );
}
