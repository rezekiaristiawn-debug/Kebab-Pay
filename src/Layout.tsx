import { type ReactNode } from 'react'

export type Page = 'beranda' | 'stok' | 'catatan' | 'dashboard' | 'grafik' | 'riwayat'

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.97-.97V19.5a2.25 2.25 0 0 1-2.25 2.25H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H6.56A2.25 2.25 0 0 1 4.31 19.5v-6.87l-.97.97a.75.75 0 0 1-1.06-1.06l8.69-8.69Z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
    </svg>
  )
}

function BoardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25A3 3 0 0 1 8.25 11.25H6a3 3 0 0 1-3-3V6Zm2.25 0a.75.75 0 0 0 .75.75h2.25a.75.75 0 0 0 .75-.75V6a.75.75 0 0 0-.75-.75H6a.75.75 0 0 0-.75.75ZM13.5 6a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25A3 3 0 0 1 18 11.25h-1.5a3 3 0 0 1-3-3V6Zm3 0a.75.75 0 0 0-.75.75V8.25c0 .414.336.75.75.75H18a.75.75 0 0 0 .75-.75V6a.75.75 0 0 0-.75-.75h-1.5ZM3 15.75A3 3 0 0 1 6 12.75h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm2.25 0a.75.75 0 0 0 .75.75h2.25a.75.75 0 0 0 .75-.75V18a.75.75 0 0 0-.75-.75H6a.75.75 0 0 0-.75.75v-.75ZM13.5 15.75a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-1.5a3 3 0 0 1-3-3v-2.25Zm3 0a.75.75 0 0 0-.75.75V18c0 .414.336.75.75.75H18a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-1.5Z" clipRule="evenodd" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z" clipRule="evenodd" />
    </svg>
  )
}

type NavItem = { id: Page; label: string; icon: () => ReactNode; accent?: boolean }

const posNavItems: NavItem[] = [
  { id: 'beranda', label: 'Home', icon: HomeIcon, accent: true },
]

const adminNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BoardIcon, accent: true },
  { id: 'grafik', label: 'Grafik', icon: ChartIcon, accent: true },
  { id: 'riwayat', label: 'Riwayat', icon: ClockIcon, accent: true },
]

interface LayoutProps {
  children: ReactNode
  activePage: Page
  onNavigate: (page: Page) => void
}

export default function Layout({ children, activePage, onNavigate }: LayoutProps) {
  const isAdmin = activePage === 'dashboard' || activePage === 'grafik' || activePage === 'riwayat'
  const navItems = isAdmin ? adminNavItems : posNavItems

  return (
    <div className="h-dvh flex flex-col bg-gray-50 overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      <footer className="flex-none z-10 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-evenly px-3 sm:px-6 h-16">
          <nav className="flex items-center justify-evenly w-full">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activePage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-label={item.label}
                  title={item.label}
                  className={`flex items-center justify-center px-3 py-2 transition-colors cursor-pointer ${
                    isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  <Icon />
                </button>
              )
            })}
          </nav>
        </div>
      </footer>
    </div>
  )
}
