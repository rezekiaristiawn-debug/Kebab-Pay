import { useState, useEffect } from 'react'
import Beranda from './Beranda'
import Admin from './Admin'
import Layout, { type Page } from './Layout'

export default function App() {
  const [activePage, setActivePage] = useState<Page>(() => {
    const path = window.location.pathname
    if (path === '/riwayat') return 'riwayat'
    return 'beranda'
  })

  useEffect(() => {
    if (window.location.pathname === '/riwayat') setActivePage('riwayat')
  }, [])

  const handleNavigate = (page: Page) => {
    setActivePage(page)
    const map: Record<Page, string> = { beranda: '/', riwayat: '/riwayat' }
    window.history.pushState(null, '', map[page])
  }

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate}>
      {activePage === 'riwayat' ? <Admin /> : <Beranda />}
    </Layout>
  )
}
