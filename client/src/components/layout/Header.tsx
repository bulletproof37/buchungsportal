import { Link, useLocation } from 'react-router-dom'
import { LABELS } from '../../utils/constants'

interface HeaderProps {
  onNewBooking?: () => void
}

export default function Header({ onNewBooking }: HeaderProps) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo und Titel */}
          <Link to="/" className="flex items-center space-x-3">
            <span className="text-2xl">🏠</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{LABELS.APP_TITLE}</h1>
              <p className="text-sm text-gray-500">{LABELS.APP_SUBTITLE}</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Übersicht
            </Link>
            <Link
              to="/statistics"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/statistics')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {LABELS.STATISTICS}
            </Link>
            <Link
              to="/settings"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/settings')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {LABELS.SETTINGS}
            </Link>

            {/* Neue Buchung Button */}
            <button
              onClick={onNewBooking}
              className="btn btn-primary flex items-center space-x-2"
            >
              <span>+</span>
              <span>{LABELS.NEW_BOOKING}</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
