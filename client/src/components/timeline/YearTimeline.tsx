import { useState, useRef, useEffect, useMemo } from 'react';
import { House, Booking, Block } from '../../types';
import { getDaysCountInYear } from '../../utils/dateUtils';
import MonthHeader from './MonthHeader';
import HouseRow from './HouseRow';
import DayNumbers from './DayNumbers';
import WeekdayRow from './WeekdayRow';
import TimelinePdfModal from './TimelinePdfModal';

interface YearTimelineProps {
  houses: House[];
  bookings: Booking[];
  blocks: Block[];
  year: number;
  onYearChange: (year: number) => void;
  onDayClick?: (house: House, date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  onBlockClick?: (block: Block) => void;
  loading?: boolean;
}

const DAY_WIDTH = 24; // Breite einer Tageszelle in Pixeln

export default function YearTimeline({
  houses,
  bookings,
  blocks,
  year,
  onYearChange,
  onDayClick,
  onBookingClick,
  onBlockClick,
  loading = false
}: YearTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrolledToToday, setScrolledToToday] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const daysInYear = useMemo(() => getDaysCountInYear(year), [year]);
  const totalWidth = daysInYear * DAY_WIDTH;

  // Exakte Pixelhöhe: h-8 (32px) + h-5 (20px) Wochentage + h-6 (24px) + n × h-10 (40px) + 20px Scrollbar
  const rowsHeight = 32 + 20 + 24 + houses.length * 40 + 20;

  // Scroll zu heute beim ersten Laden
  useEffect(() => {
    if (scrollContainerRef.current && !scrolledToToday) {
      const today = new Date();
      if (today.getFullYear() === year) {
        const dayOfYear = Math.floor(
          (today.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24)
        );
        const scrollPosition = dayOfYear * DAY_WIDTH - scrollContainerRef.current.clientWidth / 8;
        scrollContainerRef.current.scrollLeft = Math.max(0, scrollPosition);
        setScrolledToToday(true);
      }
    }
  }, [year, scrolledToToday]);

  // Reset scroll-flag bei Jahreswechsel
  useEffect(() => {
    setScrolledToToday(false);
  }, [year]);

  const handlePrevYear = () => {
    onYearChange(year - 1);
  };

  const handleNextYear = () => {
    onYearChange(year + 1);
  };

  const scrollToToday = () => {
    if (scrollContainerRef.current) {
      const today = new Date();
      const currentYear = today.getFullYear();

      if (currentYear !== year) {
        onYearChange(currentYear);
      }

      setTimeout(() => {
        if (scrollContainerRef.current) {
          const dayOfYear = Math.floor(
            (today.getTime() - new Date(currentYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)
          );
          const scrollPosition = dayOfYear * DAY_WIDTH - scrollContainerRef.current.clientWidth / 8;
          scrollContainerRef.current.scrollTo({
            left: Math.max(0, scrollPosition),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  return (
    <>
    <div className="flex flex-col">
      {/* Jahresumschalter */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevYear}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Vorheriges Jahr"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-xl font-bold text-gray-800 min-w-20 text-center">
            {year}
          </span>

          <button
            onClick={handleNextYear}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Nächstes Jahr"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={scrollToToday}
          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          Heute
        </button>

        <button
          onClick={() => setShowPdfModal(true)}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
          title="Monats-Timeline als PDF exportieren"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF
        </button>
      </div>

      {/* Ladeindikator */}
      {loading && (
        <div className="flex items-center justify-center py-4 bg-blue-50 text-blue-600">
          <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Lade Buchungen...
        </div>
      )}

      {/* Zeitstrahl Container */}
      <div style={{ height: rowsHeight }}>
        <div className="flex h-full">
          {/* Hausnamen-Spalte (sticky) */}
          <div className="w-28 min-w-28 flex-shrink-0 bg-white border-r border-gray-300 z-20">
            {/* Platzhalter für Monatsheader */}
            <div className="h-8 border-b border-gray-300 bg-gray-50" />
            {/* Platzhalter für Wochentage */}
            <div className="h-5 border-b border-gray-200 bg-gray-50" />
            {/* Platzhalter für Tagesnummern */}
            <div className="h-6 border-b border-gray-200 bg-gray-50" />
            {/* Hausnamen */}
            {houses.map(house => (
              <div
                key={house.id}
                className="h-10 flex items-center px-3 border-b border-gray-200"
              >
                <span className="font-medium text-gray-700 truncate" title={house.name}>
                  {house.name}
                </span>
              </div>
            ))}
          </div>

          {/* Scrollbarer Zeitstrahl-Bereich */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto overflow-y-hidden timeline-scroll"
          >
            <div style={{ width: totalWidth, minWidth: totalWidth }}>
              {/* Monatsheader */}
              <MonthHeader year={year} dayWidth={DAY_WIDTH} />

              {/* Wochentage */}
              <WeekdayRow year={year} dayWidth={DAY_WIDTH} />

              {/* Tagesnummern */}
              <DayNumbers year={year} dayWidth={DAY_WIDTH} />

              {/* Hauszeilen */}
              {houses.map(house => (
                <HouseRow
                  key={house.id}
                  house={house}
                  year={year}
                  bookings={bookings}
                  blocks={blocks}
                  dayWidth={DAY_WIDTH}
                  onDayClick={onDayClick}
                  onBookingClick={onBookingClick}
                  onBlockClick={onBlockClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legende */}
      <div className="flex items-center justify-end space-x-6 px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-booking" />
          <span className="text-gray-600">Buchung</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-reservation" />
          <span className="text-gray-600">Reservierung</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-block-period" />
          <span className="text-gray-600">Sperrzeit</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded bg-weekend border border-gray-300" />
          <span className="text-gray-600">Wochenende/Feiertag</span>
        </div>
      </div>
    </div>

    {showPdfModal && (
      <TimelinePdfModal year={year} onClose={() => setShowPdfModal(false)} />
    )}
    </>
  );
}
