import { ReactNode } from 'react'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
  onNewBooking?: () => void
}

export default function Layout({ children, onNewBooking }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNewBooking={onNewBooking} />
      <main className="max-w-full">
        {children}
      </main>
    </div>
  )
}
