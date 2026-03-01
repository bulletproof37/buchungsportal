import { useState, useCallback, createContext, useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import YearTimeline from './components/timeline/YearTimeline'
import BookingModal from './components/booking/BookingModal'
import BookingList from './components/booking/BookingList'
import BlockModal from './components/block/BlockModal'
import SettingsPage from './components/settings/SettingsPage'
import StatisticsPage from './components/statistics/StatisticsPage'
import { useHouses } from './hooks/useHouses'
import { useBookings } from './hooks/useBookings'
import { useSettings } from './hooks/useSettings'
import { useBlocks } from './hooks/useBlocks'
import { House, Booking, BookingInput, Block, BlockInput } from './types'

// Context für Modal-Steuerung
interface BookingModalContextType {
  openNewBooking: (houseId?: number, date?: Date) => void;
  openEditBooking: (booking: Booking) => void;
  openNewBlock: (houseId?: number, date?: Date) => void;
  openEditBlock: (block: Block) => void;
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
  blocks: Block[];
  year: number;
  onYearChange: (year: number) => void;
  loading: boolean;
  error: string | null;
}

function Dashboard({ houses, bookings, blocks, year, onYearChange, loading, error }: DashboardProps) {
  const { openNewBooking, openEditBooking, openEditBlock } = useBookingModal();

  const handleDayClick = useCallback((house: House, date: Date) => {
    openNewBooking(house.id, date);
  }, [openNewBooking]);

  const handleBookingClick = useCallback((booking: Booking) => {
    openEditBooking(booking);
  }, [openEditBooking]);

  const handleBlockClick = useCallback((block: Block) => {
    openEditBlock(block);
  }, [openEditBlock]);

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
          blocks={blocks}
          year={year}
          onYearChange={onYearChange}
          onDayClick={handleDayClick}
          onBookingClick={handleBookingClick}
          onBlockClick={handleBlockClick}
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


function App() {
  // Buchungs-Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [preselectedHouseId, setPreselectedHouseId] = useState<number | undefined>();
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>();

  // Sperr-Modal State (für Bearbeiten bestehender Sperrzeiten)
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  // Jahr für Zeitstrahl und Buchungen (gemeinsam)
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  // Hooks
  const { houses, loading: housesLoading, error: housesError } = useHouses();
  const { bookings, loading: bookingsLoading, error: bookingsError, createBooking, updateBooking, deleteBooking } = useBookings(year);
  const { settings } = useSettings();
  const { blocks, createBlock, updateBlock, deleteBlock } = useBlocks(year);

  // Buchungs-Modal öffnen
  const openNewBooking = useCallback((houseId?: number, date?: Date) => {
    setEditingBooking(null);
    setPreselectedHouseId(houseId);
    setPreselectedDate(date);
    setModalOpen(true);
  }, []);

  const openEditBooking = useCallback((booking: Booking) => {
    setEditingBooking(booking);
    setPreselectedHouseId(undefined);
    setPreselectedDate(undefined);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingBooking(null);
    setPreselectedHouseId(undefined);
    setPreselectedDate(undefined);
  }, []);

  // Sperr-Modal öffnen (nur für Bearbeiten, Erstellen läuft über BookingModal)
  const openNewBlock = useCallback(() => {
    // nicht verwendet — Sperrzeiten werden über BookingModal angelegt
  }, []);

  const openEditBlock = useCallback((block: Block) => {
    setEditingBlock(block);
    setBlockModalOpen(true);
  }, []);

  const closeBlockModal = useCallback(() => {
    setBlockModalOpen(false);
    setEditingBlock(null);
  }, []);

  // Buchungs-Handler
  const handleSave = useCallback(async (data: BookingInput): Promise<Booking | null> => {
    const result = await createBooking(data);
    if (result) {
      const checkInYear = new Date(data.check_in).getFullYear();
      if (checkInYear !== year) {
        setYear(checkInYear);
      }
    }
    return result;
  }, [createBooking, year]);

  const handleUpdate = useCallback(async (id: number, data: BookingInput): Promise<Booking | null> => {
    return await updateBooking(id, data);
  }, [updateBooking]);

  const handleDelete = useCallback(async (id: number): Promise<boolean> => {
    return await deleteBooking(id);
  }, [deleteBooking]);

  // Block-Handler
  const handleBlockSave = useCallback(async (input: BlockInput): Promise<Block | null> => {
    return await createBlock(input);
  }, [createBlock]);

  const handleBlockUpdate = useCallback(async (id: number, input: BlockInput): Promise<Block | null> => {
    return await updateBlock(id, input);
  }, [updateBlock]);

  const handleBlockDelete = useCallback(async (id: number): Promise<boolean> => {
    return await deleteBlock(id);
  }, [deleteBlock]);

  const modalContext: BookingModalContextType = {
    openNewBooking,
    openEditBooking,
    openNewBlock,
    openEditBlock
  };

  return (
    <BookingModalContext.Provider value={modalContext}>
      <Layout onNewBooking={() => openNewBooking()}>
        <Routes>
          <Route path="/" element={
            <Dashboard
              houses={houses}
              bookings={bookings}
              blocks={blocks}
              year={year}
              onYearChange={setYear}
              loading={housesLoading || bookingsLoading}
              error={housesError || bookingsError}
            />
          } />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/statistics" element={<StatisticsPage year={year} onYearChange={setYear} />} />
        </Routes>
      </Layout>

      {/* Buchungs- und Sperr-Modal (vereint) */}
      <BookingModal
        isOpen={modalOpen}
        booking={editingBooking}
        houses={houses}
        allBookings={bookings}
        blocks={blocks}
        settings={settings}
        onClose={closeModal}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onSaveBlock={handleBlockSave}
        preselectedHouseId={preselectedHouseId}
        preselectedDate={preselectedDate}
      />

      {/* Sperr-Modal (nur für Bearbeiten bestehender Sperrzeiten via Timeline-Klick) */}
      <BlockModal
        isOpen={blockModalOpen}
        block={editingBlock}
        houses={houses}
        onClose={closeBlockModal}
        onSave={handleBlockSave}
        onUpdate={handleBlockUpdate}
        onDelete={handleBlockDelete}
      />
    </BookingModalContext.Provider>
  )
}

export default App
