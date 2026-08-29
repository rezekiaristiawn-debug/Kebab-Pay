import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { type ClosingReport } from './lib/printer'
import { ReceiptCard } from './Laporan'

const CACHE_KEY = 'kebab_history'

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

export default function History() {
  const [reports, setReports] = useState<ClosingReport[]>(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  })
  const [loading, setLoading] = useState(true)
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    supabase
      .from('closing_reports')
      .select('*')
      .eq('archived', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          supabase.from('closing_reports').select('*').order('created_at', { ascending: false }).then(({ data: d2 }) => {
            if (d2) { setReports(d2 as ClosingReport[]); localStorage.setItem(CACHE_KEY, JSON.stringify(d2)) }
            setLoading(false)
          })
          return
        }
        if (data) { setReports(data as ClosingReport[]); localStorage.setItem(CACHE_KEY, JSON.stringify(data)) }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    setLoading(true)
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [load])

  const groups = reports.reduce<Record<string, ClosingReport[]>>((acc, r) => {
    const key = r.tanggal.slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))
  const filteredDates = search
    ? sortedDates.filter((tgl) => dateLabel(tgl).toLowerCase().includes(search.toLowerCase()))
    : sortedDates

  const handleDeleteDate = async (tgl: string) => {
    const list = groups[tgl]
    if (!list || list.length === 0) return
    if (!confirm(`Hapus ${list.length} laporan tanggal ${dateLabel(tgl)}? Data akan dihapus permanen.`)) return
    const ids = list.map((r) => r.id)
    const { error } = await supabase.from('closing_reports').delete().in('id', ids)
    if (error) { alert('Gagal menghapus: ' + error.message); return }
    setReports((prev) => {
      const next = prev.filter((r) => r.tanggal.slice(0, 10) !== tgl)
      localStorage.setItem(CACHE_KEY, JSON.stringify(next))
      return next
    })
    setOpenDates((prev) => { const next = { ...prev }; delete next[tgl]; return next })
  }

  function dateLabel(tgl: string) {
    return new Date(tgl + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Riwayat</h1>
        <p className="text-sm text-gray-400">{reports.length} laporan</p>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari tanggal..."
        className="w-full text-sm border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:border-gray-400 mb-3"
      />

      {loading ? (
        <div className="bg-white border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-400">Memuat data...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-400">Belum ada history.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDates.map((tgl) => {
            const open = search ? true : openDates[tgl]
            return (
              <div key={tgl} className="bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setOpenDates((prev) => ({ ...prev, [tgl]: !prev[tgl] }))}
                    className="flex-1 min-w-0 flex items-center justify-between px-3 py-2.5 transition-colors cursor-pointer hover:bg-gray-50"
                  >
                    <span className="text-sm font-bold text-gray-800">{dateLabel(tgl)}</span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{groups[tgl].length} laporan</span>
                  </button>
                  <button
                    onClick={() => handleDeleteDate(tgl)}
                    title="Hapus semua laporan tanggal ini"
                    className="p-1.5 text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                  >
                    <TrashIcon />
                  </button>
                </div>
                {open && (
                  <div className="p-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groups[tgl].map((r) => (
                      <div key={r.id} className="w-full max-w-xs justify-self-center">
                        <ReceiptCard report={r} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
