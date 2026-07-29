import { type ReactNode } from 'react'

export type Page = 'beranda' | 'stok' | 'catatan' | 'dashboard'

interface LayoutProps {
  children: ReactNode
  activePage: Page
  onNavigate: (page: Page) => void
}

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.97-.97V19.5a2.25 2.25 0 0 1-2.25 2.25H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H6.56A2.25 2.25 0 0 1 4.31 19.5v-6.87l-.97.97a.75.75 0 0 1-1.06-1.06l8.69-8.69Z" />
    </svg>
  )
}

function StockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375ZM19.5 9.75c0-1.036-.84-1.875-1.875-1.875H6.375c-1.036 0-1.875.84-1.875 1.875v.75c0 1.035.84 1.875 1.875 1.875h11.25c1.035 0 1.875-.84 1.875-1.875v-.75ZM3.75 15c0-1.036-.84-1.875-1.875-1.875S0 13.964 0 15v.75c0 1.036.84 1.875 1.875 1.875S3.75 16.786 3.75 15.75v-.75Z" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M7.5 6a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 6ZM7.5 12a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 12Zm.75 5.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M3 5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v13.5A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V5.25ZM5.25 4.5A.75.75 0 0 0 4.5 5.25v13.5c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75V5.25a.75.75 0 0 0-.75-.75H5.25Z" clipRule="evenodd" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
    </svg>
  )
}

const navItems: { id: Page; label: string; icon: () => ReactNode }[] = [
  { id: 'beranda', label: 'Beranda', icon: HomeIcon },
  { id: 'stok', label: 'Stok', icon: StockIcon },
  { id: 'catatan', label: 'Catatan', icon: NotesIcon },
  { id: 'dashboard', label: 'Dashboard', icon: ChartIcon },
]

export default function Layout({ children, activePage, onNavigate }: LayoutProps) {
  return (
    <div className="h-dvh flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Top Nav */}
      <header className="md:hidden flex-none bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
          <img src="/asset/logokebabgatsu.png" alt="Logo" className="w-7 h-7 object-contain" />
          <span className="text-base font-bold text-gray-800">Kebab Gatsu</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isActive ? 'text-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <img src="/asset/logokebabgatsu.png" alt="Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-lg font-bold text-gray-800">Kebab Gatsu</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">Kebab Gatsu POS</p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
