import { useMemo } from 'react';
import { getDaysInYear, isWeekend } from '../../utils/dateUtils';
import { isHoliday } from '../../utils/holidays';

interface DayNumbersProps {
  year: number;
  dayWidth: number;
}

export default function DayNumbers({ year, dayWidth }: DayNumbersProps) {
  const days = useMemo(() => getDaysInYear(year), [year]);

  return (
    <div className="flex border-b border-gray-200 bg-gray-50 h-6">
      {days.map((date, index) => {
        const dayOfMonth = date.getDate();
        const isFirstOfMonth = dayOfMonth === 1;
        const isWeekendDay = isWeekend(date);
        const isHolidayDay = isHoliday(date);
        const isSpecialDay = isWeekendDay || isHolidayDay;

        return (
          <div
            key={index}
            className={`flex-shrink-0 text-center text-xs flex items-center justify-center border-r border-r-gray-200 ${
              isFirstOfMonth ? 'border-l border-l-gray-400' : ''
            } ${isSpecialDay ? 'bg-weekend text-gray-500' : 'text-gray-600'}`}
            style={{ width: dayWidth, minWidth: dayWidth }}
          >
            {dayOfMonth}
          </div>
        );
      })}
    </div>
  );
}
