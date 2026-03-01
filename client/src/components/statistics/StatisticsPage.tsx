import { useState, useEffect } from 'react';
import { Statistics } from '../../types';
import { API } from '../../utils/constants';
import { formatPrice } from '../../utils/pricing';

interface StatisticsPageProps {
  year: number;
  onYearChange: (year: number) => void;
}

export default function StatisticsPage({ year, onYearChange }: StatisticsPageProps) {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setStats(null);
    fetch(`${API.STATISTICS}?from=${year}-01-01&to=${year}-12-31`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setStats(data.data);
        else setError(data.error ?? 'Fehler beim Laden');
      })
      .catch(() => setError('Netzwerkfehler'))
      .finally(() => setLoading(false));
  }, [year]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header mit Jahreswechsel */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Statistik</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onYearChange(year - 1)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Vorheriges Jahr"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xl font-bold text-gray-800 min-w-16 text-center">{year}</span>
          <button
            onClick={() => onYearChange(year + 1)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Nächstes Jahr"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center space-x-2 text-gray-500 py-8">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Lade Statistiken...</span>
        </div>
      )}

      {error && (
        <div className="text-red-500 py-8">{error}</div>
      )}

      {stats && (
        <>
          {/* Gesamtkennzahlen */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard label="Umsatz" value={formatPrice(stats.total.revenue)} highlight />
            <StatCard label="Buchungen" value={String(stats.total.booking_count)} />
            <StatCard label="Reservierungen" value={String(stats.total.reservation_count)} />
            <StatCard label="Übernachtungen" value={String(stats.total.overnight_stays)} />
            <StatCard label="Belegung Ø" value={`${stats.total.occupancy_rate} %`} />
          </div>

          {/* Tabelle pro Haus */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Ferienhaus</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Buchungen</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Reservierungen</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Übernachtungen</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Belegung</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">Umsatz</th>
                </tr>
              </thead>
              <tbody>
                {stats.houses.map((h, idx) => (
                  <tr key={h.house_id} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{h.house_name}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{h.booking_count}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{h.reservation_count}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{h.overnight_stays}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{h.occupancy_rate} %</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-800">{formatPrice(h.revenue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300 bg-gray-100">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-gray-900">Gesamt</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">{stats.total.booking_count}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">{stats.total.reservation_count}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">{stats.total.overnight_stays}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">{stats.total.occupancy_rate} %</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-900">{formatPrice(stats.total.revenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {stats.total.booking_count === 0 && stats.total.reservation_count === 0 && (
            <p className="text-center text-gray-400 text-sm mt-6">
              Keine Buchungen oder Reservierungen für {year} vorhanden.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
