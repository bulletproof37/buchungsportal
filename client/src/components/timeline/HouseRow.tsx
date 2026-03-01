import { useMemo } from 'react';
import { House, Booking, Block } from '../../types';
import { getDaysInYear } from '../../utils/dateUtils';
import DayCell from './DayCell';
import BookingBar from './BookingBar';
import BlockBar from './BlockBar';

interface HouseRowProps {
  house: House;
  year: number;
  bookings: Booking[];
  blocks: Block[];
  dayWidth: number;
  onDayClick?: (house: House, date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  onBlockClick?: (block: Block) => void;
}

export default function HouseRow({
  house,
  year,
  bookings,
  blocks,
  dayWidth,
  onDayClick,
  onBookingClick,
  onBlockClick
}: HouseRowProps) {
  const days = useMemo(() => getDaysInYear(year), [year]);

  const yearStart = useMemo(() => new Date(year, 0, 1), [year]);
  const yearEnd = useMemo(() => new Date(year, 11, 31, 23, 59, 59), [year]);

  const houseBookings = useMemo(() => bookings.filter(b => b.house_id === house.id), [bookings, house.id]);
  const houseBlocks = useMemo(() => blocks.filter(b => b.house_id === house.id), [blocks, house.id]);

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

        {/* Sperrzeiten (unter Buchungen) */}
        {houseBlocks.map(block => (
          <BlockBar
            key={`block-${block.id}`}
            block={block}
            dayWidth={dayWidth}
            yearStart={yearStart}
            yearEnd={yearEnd}
            onClick={onBlockClick}
          />
        ))}

        {/* Buchungsbalken */}
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
