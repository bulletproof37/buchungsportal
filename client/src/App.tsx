import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'

function Dashboard() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Jahresübersicht</h2>
      <p className="text-gray-500">Zeitstrahl wird in Phase 2 implementiert...</p>
    </div>
  )
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
