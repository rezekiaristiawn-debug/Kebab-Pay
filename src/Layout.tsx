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
      <path d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15ZM12 8.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm4.5 2.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V11.25a.75.75 0 0 1 .75-.75ZM7.5 9.75a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V10.5a.75.75 0 0 1 .75-.75Z" />
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
  { id: 'stok', label: 'Stok', icon: StockIcon, accent: true },
  { id: 'catatan', label: 'Pengeluaran', icon: NotesIcon, accent: true },
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
      <header className="flex-none z-10 bg-white border-b border-gray-200 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2">
          <div className="flex items-center gap-2 shrink-0">
            <img
              src="/asset/logokebabgatsu.png"
              alt="Kebab Gatsu"
              className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-bold text-black leading-none">Kebab</span>
              <span className="text-2xl font-bold text-black leading-none">Gatsu</span>
            </div>
          </div>

          <nav className="flex items-center shrink-0">
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
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
