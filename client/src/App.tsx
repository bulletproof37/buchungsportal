import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import YearTimeline from './components/timeline/YearTimeline'
import { useHouses } from './hooks/useHouses'
import { useBookings } from './hooks/useBookings'
import { House, Booking } from './types'

function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { houses, loading: housesLoading, error: housesError } = useHouses();
  const { bookings, loading: bookingsLoading, error: bookingsError } = useBookings(year);

  const handleDayClick = (house: House, date: Date) => {
    // Wird in Phase 3 mit Buchungsmodal verbunden
    console.log('Tag geklickt:', house.name, date.toISOString().split('T')[0]);
  };

  const handleBookingClick = (booking: Booking) => {
    // Wird in Phase 3 mit Buchungsmodal verbunden
    console.log('Buchung geklickt:', booking.id, booking.guest_last_name);
  };

  if (housesError || bookingsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 font-medium">Fehler beim Laden der Daten</p>
          <p className="text-gray-500 text-sm mt-1">{housesError || bookingsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)]">
      <YearTimeline
        houses={houses}
        bookings={bookings}
        year={year}
        onYearChange={setYear}
        onDayClick={handleDayClick}
        onBookingClick={handleBookingClick}
        loading={housesLoading || bookingsLoading}
      />
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Einstellungen</h2>
      <p className="text-gray-500">Einstellungen werden in Phase 4 implementiert...</p>
    </div>
  )
}

function StatisticsPage() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Statistik</h2>
      <p className="text-gray-500">Statistik wird in Phase 5 implementiert...</p>
    </div>
  )
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
      </Routes>
    </Layout>
  )
}

export default App
