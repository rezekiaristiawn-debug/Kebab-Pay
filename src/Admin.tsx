import { useState } from 'react'
import Dashboard from './Dashboard'
import History from './History'

type Tab = 'grafik' | 'riwayat'

const TABS: { id: Tab; label: string }[] = [
  { id: 'grafik', label: 'Grafik' },
  { id: 'riwayat', label: 'Riwayat' },
]

export default function Admin() {
  const [tab, setTab] = useState<Tab>('grafik')

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <div className="flex-none bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center gap-1 px-3 sm:px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                tab === t.id
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'grafik' ? <Dashboard /> : <History />}
    </div>
  )
}
