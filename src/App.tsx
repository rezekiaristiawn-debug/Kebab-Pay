import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import Laporan from './Laporan'
import History from './History'
import Layout, { type Page } from './Layout'

export default function App() {
  const [activePage, setActivePage] = useState<Page>(() => {
    const path = window.location.pathname
    if (path === '/grafik') return 'grafik'
    if (path === '/riwayat') return 'riwayat'
    return 'dashboard'
  })

  useEffect(() => {
    const path = window.location.pathname
    if (path === '/grafik') setActivePage('grafik')
    else if (path === '/riwayat') setActivePage('riwayat')
  }, [])

  const handleNavigate = (page: Page) => {
    setActivePage(page)
    const map: Record<Page, string> = { dashboard: '/', grafik: '/grafik', riwayat: '/riwayat' }
    window.history.pushState(null, '', map[page])
  }

  const page = () => {
    switch (activePage) {
      case 'dashboard': return <Laporan />
      case 'grafik': return <Dashboard />
      case 'riwayat': return <History />
    }
  }

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate}>
      {page()}
    </Layout>
  )
}
