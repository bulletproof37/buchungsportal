import { isWeekend, toISODateString } from '../../utils/dateUtils';
import { isHoliday, getHolidayName } from '../../utils/holidays';

interface DayCellProps {
  date: Date;
  dayWidth: number;
  onDayClick?: (date: Date, half: 'morning' | 'afternoon') => void;
}

export default function DayCell({ date, dayWidth, onDayClick }: DayCellProps) {
  const isWeekendDay = isWeekend(date);
  const isHolidayDay = isHoliday(date);
  const holidayName = getHolidayName(date);
  const isSpecialDay = isWeekendDay || isHolidayDay;
  const dayOfMonth = date.getDate();
  const isFirstOfMonth = dayOfMonth === 1;

  const baseClass = 'h-full border-r border-r-gray-200 flex';
  const bgClass = isSpecialDay ? 'bg-weekend' : 'bg-white';
  const borderClass = isFirstOfMonth ? 'border-l border-l-gray-400' : '';

  const handleClick = (half: 'morning' | 'afternoon') => (e: React.MouseEvent) => {
    e.stopPropagation();
    onDayClick?.(date, half);
  };

  return (
    <div
      className={`${baseClass} ${bgClass} ${borderClass}`}
      style={{ width: dayWidth, minWidth: dayWidth }}
      title={holidayName || toISODateString(date)}
    >
      {/* Linke Hälfte (Vormittag/Abreise) */}
      <div
        className="w-1/2 h-full cursor-pointer hover:bg-gray-100/50"
        onClick={handleClick('morning')}
      />
      {/* Rechte Hälfte (Nachmittag/Anreise) */}
      <div
        className="w-1/2 h-full cursor-pointer hover:bg-gray-100/50"
        onClick={handleClick('afternoon')}
      />
    </div>
  );
}
