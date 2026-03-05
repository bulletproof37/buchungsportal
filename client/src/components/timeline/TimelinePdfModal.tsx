import { useState } from 'react';
import { API } from '../../utils/constants';

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

interface TimelinePdfModalProps {
  year: number;
  onClose: () => void;
}

export default function TimelinePdfModal({ year, onClose }: TimelinePdfModalProps) {
  const [selectedMonths, setSelectedMonths] = useState<number[]>(() => {
    const m = new Date().getMonth() + 1;
    return [m];
  });

  const toggle = (m: number) => {
    setSelectedMonths(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const handleExport = () => {
    if (selectedMonths.length === 0) return;
    const url = `${API.BOOKINGS}/timeline-pdf?year=${year}&months=${selectedMonths.join(',')}`;
    window.open(url, '_blank');
    onClose();
  };

  const pages = Math.ceil(selectedMonths.length / 2);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Timeline als PDF</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">Monate auswählen (max. 2 pro Seite, DIN A4 quer):</p>

          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
            {MONTHS.map((name, idx) => {
              const m = idx + 1;
              return (
                <label key={m} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedMonths.includes(m)}
                    onChange={() => toggle(m)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
                  />
                  <span className="text-sm text-gray-700">{name}</span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                className="text-blue-600 hover:underline"
              >
                Alle
              </button>
              <button
                onClick={() => setSelectedMonths([])}
                className="text-blue-600 hover:underline"
              >
                Keine
              </button>
            </div>
            {selectedMonths.length > 0 && (
              <span>
                {selectedMonths.length} Monat{selectedMonths.length !== 1 ? 'e' : ''} → {pages} Seite{pages !== 1 ? 'n' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">Abbrechen</button>
          <button
            onClick={handleExport}
            disabled={selectedMonths.length === 0}
            className="btn btn-primary disabled:opacity-50"
          >
            PDF erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
