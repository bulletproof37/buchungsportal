import { useMemo } from 'react';
import { getMonthName, getLastDayOfMonth } from '../../utils/dateUtils';

interface MonthHeaderProps {
  year: number;
  dayWidth: number;
}

interface MonthInfo {
  name: string;
  daysInMonth: number;
  startDay: number;
}

export default function MonthHeader({ year, dayWidth }: MonthHeaderProps) {
  const months = useMemo(() => {
    const result: MonthInfo[] = [];
    let startDay = 0;

    for (let month = 0; month < 12; month++) {
      const daysInMonth = getLastDayOfMonth(year, month).getDate();
      result.push({
        name: getMonthName(month),
        daysInMonth,
        startDay
      });
      startDay += daysInMonth;
    }

    return result;
  }, [year]);

  return (
    <div className="flex border-b border-gray-300 bg-gray-50">
      {months.map((month, index) => (
        <div
          key={index}
          className="flex-shrink-0 border-r border-gray-200 text-center text-sm font-semibold text-gray-700 py-1"
          style={{ width: month.daysInMonth * dayWidth }}
        >
          {month.name}
        </div>
      ))}
    </div>
  );
}
