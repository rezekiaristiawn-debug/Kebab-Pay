import { type ReactNode } from 'react'

export type Page = 'beranda' | 'riwayat'

interface LayoutProps {
  children: ReactNode
  activePage: Page
  onNavigate: (page: Page) => void
}

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

const navItems: { id: Page; label: string; icon: () => ReactNode }[] = [
  { id: 'beranda', label: 'Beranda', icon: HomeIcon },
  { id: 'riwayat', label: 'Riwayat', icon: ClockIcon },
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
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
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
          <p className="text-xs text-gray-400">Kebab Gatsu App</p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
