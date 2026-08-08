import { type ReactNode } from 'react'

export type Page = 'beranda' | 'stok' | 'catatan' | 'dashboard' | 'grafik' | 'riwayat'

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.97-.97V19.5a2.25 2.25 0 0 1-2.25 2.25H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H6.56A2.25 2.25 0 0 1 4.31 19.5v-6.87l-.97.97a.75.75 0 0 1-1.06-1.06l8.69-8.69Z" />
    </svg>
  )
}

function StockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375ZM19.5 9.75c0-1.036-.84-1.875-1.875-1.875H6.375c-1.036 0-1.875.84-1.875 1.875v.75c0 1.035.84 1.875 1.875 1.875h11.25c1.035 0 1.875-.84 1.875-1.875v-.75ZM3.75 15c0-1.036-.84-1.875-1.875-1.875S0 13.964 0 15v.75c0 1.036.84 1.875 1.875 1.875S3.75 16.786 3.75 15.75v-.75Z" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M7.5 6a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 6ZM7.5 12a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 12Zm.75 5.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M3 5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v13.5A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V5.25ZM5.25 4.5A.75.75 0 0 0 4.5 5.25v13.5c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75V5.25a.75.75 0 0 0-.75-.75H5.25Z" clipRule="evenodd" />
    </svg>
  )
}

type NavItem = { id: Page; label: string; icon: () => ReactNode; accent?: boolean }

const posNavItems: NavItem[] = [
  { id: 'beranda', label: 'Home', icon: HomeIcon, accent: true },
  { id: 'stok', label: 'Stok', icon: StockIcon, accent: true },
  { id: 'catatan', label: 'Pengeluaran', icon: NotesIcon, accent: true },
]

interface LayoutProps {
  children: ReactNode
  activePage: Page
  onNavigate: (page: Page) => void
}

export default function Layout({ children, activePage, onNavigate }: LayoutProps) {
  const navItems = posNavItems

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
                    isActive ? 'text-[#F84616]' : 'text-gray-500 hover:text-[#F84616]'
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
