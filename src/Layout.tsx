import { type ReactNode } from 'react'

export type Page = 'dashboard' | 'laporan' | 'arsip'

interface LayoutProps {
  children: ReactNode
  activePage: Page
  onNavigate: (page: Page) => void
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
    </svg>
  )
}

function ReportIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25 2.625 2.625 0 0 0 0-5.25ZM12.75 3.75a2.625 2.625 0 1 0 0 5.25 2.625 2.625 0 0 0 0-5.25ZM5.625 9.75a2.625 2.625 0 1 0 0 5.25 2.625 2.625 0 0 0 0-5.25ZM12.75 9.75a2.625 2.625 0 1 0 0 5.25 2.625 2.625 0 0 0 0-5.25ZM5.625 15.75a2.625 2.625 0 1 0 0 5.25 2.625 2.625 0 0 0 0-5.25ZM19.5 5.625a2.625 2.625 0 1 0-5.25 0 2.625 2.625 0 0 0 5.25 0ZM19.5 11.25a2.625 2.625 0 1 0-5.25 0 2.625 2.625 0 0 0 5.25 0Z" />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375ZM3.75 10.5a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75ZM3.75 14.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75ZM3.75 18a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15A.75.75 0 0 1 3.75 18Z" />
    </svg>
  )
}

const navItems: { id: Page; label: string; icon: () => ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: ChartIcon },
  { id: 'laporan', label: 'Laporan', icon: ReportIcon },
  { id: 'arsip', label: 'Arsip', icon: ArchiveIcon },
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
          <p className="text-xs text-gray-400">Pusat Monitoring</p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
