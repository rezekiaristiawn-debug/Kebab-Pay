import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import Laporan from './Laporan'
import Arsip from './Arsip'
import Layout, { type Page } from './Layout'

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')

  useEffect(() => {
    const path = window.location.pathname
    if (path === '/laporan') setActivePage('laporan')
    else if (path === '/arsip') setActivePage('arsip')
  }, [])

  const handleNavigate = (page: Page) => {
    setActivePage(page)
    const map: Record<Page, string> = { dashboard: '/', laporan: '/laporan', arsip: '/arsip' }
    window.history.pushState(null, '', map[page])
  }

  const page = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />
      case 'laporan': return <Laporan />
      case 'arsip': return <Arsip />
    }
  }

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate}>
      {page()}
    </Layout>
  )
}
