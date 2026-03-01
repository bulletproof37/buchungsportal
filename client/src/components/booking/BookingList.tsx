import { useState, useMemo } from 'react';
import { Booking, House } from '../../types';
import { formatDate, calculateNights } from '../../utils/dateUtils';
import { formatPrice } from '../../utils/pricing';

interface BookingListProps {
  bookings: Booking[];
  houses: House[];
  onBookingClick: (booking: Booking) => void;
}

type SortField = 'house' | 'status' | 'guest' | 'check_in' | 'check_out' | 'nights' | 'total_price';
type SortDir = 'asc' | 'desc';

const STATUS_LABEL: Record<string, string> = {
  booking: 'Buchung',
  reservation: 'Reservierung'
};

export default function BookingList({ bookings, houses, onBookingClick }: BookingListProps) {
  const [sortField, setSortField] = useState<SortField>('check_in');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const houseMap = useMemo(() => {
    const m: Record<number, string> = {};
    houses.forEach(h => { m[h.id] = h.name; });
    return m;
  }, [houses]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    return [...bookings].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'house':
          valA = houseMap[a.house_id] ?? '';
          valB = houseMap[b.house_id] ?? '';
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'guest':
          valA = `${a.guest_last_name} ${a.guest_first_name}`;
          valB = `${b.guest_last_name} ${b.guest_first_name}`;
          break;
        case 'check_in':
          valA = a.check_in;
          valB = b.check_in;
          break;
        case 'check_out':
          valA = a.check_out;
          valB = b.check_out;
          break;
        case 'nights':
          valA = calculateNights(a.check_in, a.check_out);
          valB = calculateNights(b.check_in, b.check_out);
          break;
        case 'total_price':
          valA = a.total_price;
          valB = b.total_price;
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [bookings, sortField, sortDir, houseMap]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-gray-300">↕</span>;
    }
    return <span className="ml-1 text-gray-600">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const thClass = 'px-3 py-1 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer select-none hover:bg-gray-100 whitespace-nowrap';
  const tdClass = 'px-3 py-1 text-sm text-gray-700 whitespace-nowrap';

  return (
    <div className="border-t border-gray-300 bg-white flex flex-col" style={{ height: '148px' }}>
      <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700">
          Buchungen ({bookings.length})
        </span>
        <span className="text-xs text-gray-400">Spaltenüberschrift klicken zum Sortieren</span>
      </div>

      <div className="overflow-auto flex-1">
        {bookings.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Keine Buchungen vorhanden
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
              <tr>
                <th className={thClass} onClick={() => handleSort('house')}>
                  Haus <SortIcon field="house" />
                </th>
                <th className={thClass} onClick={() => handleSort('status')}>
                  Status <SortIcon field="status" />
                </th>
                <th className={thClass} onClick={() => handleSort('guest')}>
                  Gast <SortIcon field="guest" />
                </th>
                <th className={thClass} onClick={() => handleSort('check_in')}>
                  Anreise <SortIcon field="check_in" />
                </th>
                <th className={thClass} onClick={() => handleSort('check_out')}>
                  Abreise <SortIcon field="check_out" />
                </th>
                <th className={thClass} onClick={() => handleSort('nights')}>
                  Nächte <SortIcon field="nights" />
                </th>
                <th className={`${thClass} text-right`} onClick={() => handleSort('total_price')}>
                  Gesamtpreis <SortIcon field="total_price" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((booking, idx) => (
                <tr
                  key={booking.id}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                  onClick={() => onBookingClick(booking)}
                >
                  <td className={tdClass}>{houseMap[booking.house_id] ?? '–'}</td>
                  <td className={tdClass}>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      booking.status === 'booking'
                        ? 'bg-booking text-gray-800'
                        : 'bg-reservation text-gray-800'
                    }`}>
                      {STATUS_LABEL[booking.status]}
                    </span>
                  </td>
                  <td className={tdClass}>
                    {booking.guest_last_name}{booking.guest_first_name ? `, ${booking.guest_first_name}` : ''}
                  </td>
                  <td className={tdClass}>{formatDate(booking.check_in)}</td>
                  <td className={tdClass}>{formatDate(booking.check_out)}</td>
                  <td className={tdClass}>{calculateNights(booking.check_in, booking.check_out)}</td>
                  <td className={`${tdClass} text-right font-medium`}>{formatPrice(booking.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
