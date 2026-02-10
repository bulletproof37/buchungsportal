import { ReactNode, useState } from 'react'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [showBookingModal, setShowBookingModal] = useState(false)

  const handleNewBooking = () => {
    setShowBookingModal(true)
    // Modal wird in Phase 3 implementiert
    console.log('Neue Buchung öffnen...')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNewBooking={handleNewBooking} />
      <main className="max-w-full">
        {children}
      </main>

      {/* Buchungsmodal Platzhalter - wird in Phase 3 implementiert */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content p-6 max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Neue Buchung</h2>
            <p className="text-gray-500 mb-4">Buchungsformular wird in Phase 3 implementiert...</p>
            <button
              onClick={() => setShowBookingModal(false)}
              className="btn btn-secondary"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
