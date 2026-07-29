import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import Laporan from './Laporan'
import History from './History'
import Layout, { type Page } from './Layout'

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')

  useEffect(() => {
    const path = window.location.pathname
    if (path === '/laporan') setActivePage('laporan')
    else if (path === '/history') setActivePage('history')
  }, [])

  const handleNavigate = (page: Page) => {
    setActivePage(page)
    const map: Record<Page, string> = { dashboard: '/', laporan: '/laporan', history: '/history' }
    window.history.pushState(null, '', map[page])
  }

  const page = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />
      case 'laporan': return <Laporan />
      case 'history': return <History />
    }
  }

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate}>
      {page()}
    </Layout>
  )
}
