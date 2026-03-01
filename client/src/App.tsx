import { useState, useCallback, createContext, useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import YearTimeline from './components/timeline/YearTimeline'
import BookingModal from './components/booking/BookingModal'
import BookingList from './components/booking/BookingList'
import { useHouses } from './hooks/useHouses'
import { useBookings } from './hooks/useBookings'
import { useSettings } from './hooks/useSettings'
import { House, Booking, BookingInput } from './types'

// Context für Modal-Steuerung
interface BookingModalContextType {
  openNewBooking: (houseId?: number, date?: Date) => void;
  openEditBooking: (booking: Booking) => void;
}

const BookingModalContext = createContext<BookingModalContextType | null>(null);

export function useBookingModal() {
  const context = useContext(BookingModalContext);
  if (!context) {
    throw new Error('useBookingModal must be used within BookingModalContext');
  }
  return context;
}

interface DashboardProps {
  houses: House[];
  bookings: Booking[];
  year: number;
  onYearChange: (year: number) => void;
  loading: boolean;
  error: string | null;
}

function Dashboard({ houses, bookings, year, onYearChange, loading, error }: DashboardProps) {
  const { openNewBooking, openEditBooking } = useBookingModal();

  const handleDayClick = useCallback((house: House, date: Date) => {
    openNewBooking(house.id, date);
  }, [openNewBooking]);

  const handleBookingClick = useCallback((booking: Booking) => {
    openEditBooking(booking);
  }, [openEditBooking]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 font-medium">Fehler beim Laden der Daten</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="flex-1 min-h-0">
        <YearTimeline
          houses={houses}
          bookings={bookings}
          year={year}
          onYearChange={onYearChange}
          onDayClick={handleDayClick}
          onBookingClick={handleBookingClick}
          loading={loading}
        />
      </div>
      <BookingList
        bookings={bookings}
        houses={houses}
        onBookingClick={handleBookingClick}
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
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [preselectedHouseId, setPreselectedHouseId] = useState<number | undefined>();
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>();

  // Jahr für Zeitstrahl und Buchungen (gemeinsam)
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  // Hooks
  const { houses, loading: housesLoading, error: housesError } = useHouses();
  const { bookings, loading: bookingsLoading, error: bookingsError, createBooking, updateBooking, deleteBooking } = useBookings(year);
  const { settings } = useSettings();

  // Modal öffnen für neue Buchung
  const openNewBooking = useCallback((houseId?: number, date?: Date) => {
    setEditingBooking(null);
    setPreselectedHouseId(houseId);
    setPreselectedDate(date);
    setModalOpen(true);
  }, []);

  // Modal öffnen für bestehende Buchung
  const openEditBooking = useCallback((booking: Booking) => {
    setEditingBooking(booking);
    setPreselectedHouseId(undefined);
    setPreselectedDate(undefined);
    setModalOpen(true);
  }, []);

  // Modal schließen
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingBooking(null);
    setPreselectedHouseId(undefined);
    setPreselectedDate(undefined);
  }, []);

  // Buchung speichern
  const handleSave = useCallback(async (data: BookingInput): Promise<Booking | null> => {
    const result = await createBooking(data);
    if (result) {
      // Jahr aktualisieren falls nötig
      const checkInYear = new Date(data.check_in).getFullYear();
      if (checkInYear !== year) {
        setYear(checkInYear);
      }
    }
    return result;
  }, [createBooking, year]);

  // Buchung aktualisieren
  const handleUpdate = useCallback(async (id: number, data: BookingInput): Promise<Booking | null> => {
    return await updateBooking(id, data);
  }, [updateBooking]);

  // Buchung löschen
  const handleDelete = useCallback(async (id: number): Promise<boolean> => {
    return await deleteBooking(id);
  }, [deleteBooking]);

  const modalContext: BookingModalContextType = {
    openNewBooking,
    openEditBooking
  };

  return (
    <BookingModalContext.Provider value={modalContext}>
      <Layout onNewBooking={() => openNewBooking()}>
        <Routes>
          <Route path="/" element={
            <Dashboard
              houses={houses}
              bookings={bookings}
              year={year}
              onYearChange={setYear}
              loading={housesLoading || bookingsLoading}
              error={housesError || bookingsError}
            />
          } />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
        </Routes>
      </Layout>

      {/* Buchungsmodal */}
      <BookingModal
        isOpen={modalOpen}
        booking={editingBooking}
        houses={houses}
        allBookings={bookings}
        settings={settings}
        onClose={closeModal}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        preselectedHouseId={preselectedHouseId}
        preselectedDate={preselectedDate}
      />
    </BookingModalContext.Provider>
  )
}

export default App
