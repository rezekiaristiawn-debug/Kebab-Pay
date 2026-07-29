import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import Laporan from './Laporan'
import Layout, { type Page } from './Layout'

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')

  useEffect(() => {
    if (window.location.pathname === '/laporan') {
      setActivePage('laporan')
    }
  }, [])

  const handleNavigate = (page: Page) => {
    setActivePage(page)
    window.history.pushState(null, '', page === 'dashboard' ? '/' : '/laporan')
  }

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate}>
      {activePage === 'dashboard' ? <Dashboard /> : <Laporan />}
    </Layout>
  )
}
