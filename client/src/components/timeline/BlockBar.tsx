import { Block } from '../../types';

interface BlockBarProps {
  block: Block;
  dayWidth: number;
  yearStart: Date;
  yearEnd: Date;
  onClick?: (block: Block) => void;
}

export default function BlockBar({ block, dayWidth, yearStart, yearEnd, onClick }: BlockBarProps) {
  const dateFrom = new Date(block.date_from);
  const dateTo = new Date(block.date_to); // exklusiv (Tag nach dem letzten gesperrten Tag)

  // Begrenze auf das aktuelle Jahr
  const displayStart = dateFrom < yearStart ? yearStart : dateFrom;
  const displayEnd = dateTo > yearEnd ? yearEnd : dateTo;

  const startDay = Math.floor((displayStart.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
  const endDay = Math.floor((displayEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));

  // Sperren decken ganze Tage ab (keine Halbtag-Logik)
  const leftOffset = startDay * dayWidth;
  const width = (endDay - startDay) * dayWidth;

  if (width <= 0) return null;

  return (
    <div
      className="absolute top-1 bottom-1 bg-block-period hover:bg-block-period-dark rounded text-gray-700 text-xs font-medium px-1 truncate flex items-center cursor-pointer transition-colors shadow-sm opacity-90"
      style={{ left: leftOffset, width: Math.max(width, 20) }}
      onClick={() => onClick?.(block)}
      title={block.description || 'Gesperrt'}
    >
      <span className="truncate">{block.description || 'Gesperrt'}</span>
    </div>
  );
}
