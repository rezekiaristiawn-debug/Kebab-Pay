import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'

interface ClosingReport {
  id: number
  nama_lapak: string
  tanggal: string
  omset_kotor: number
  gaji_kru: number
  pengeluaran: { name: string; amount: number }[]
  total_pengeluaran: number
  omset_bersih: number
  item_terjual: number
  created_at: string
}

const CACHE_KEY = 'kebab_history'

export default function History() {
  const [reports, setReports] = useState<ClosingReport[]>(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  })
  const [loading, setLoading] = useState(true)

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
    const id = setInterval(load, 10000); return () => clearInterval(id)
  }, [load])

  const groups = reports.reduce<Record<string, ClosingReport[]>>((acc, r) => {
    const key = r.tanggal.slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))

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

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-400">Memuat data...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-400">Belum ada history.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((tgl) => (
            <div key={tgl}>
              <h2 className="text-sm font-semibold text-gray-600 mb-2">{dateLabel(tgl)}</h2>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {groups[tgl].map((r) => (
                  <div key={r.id} className="bg-white w-56 border-2 border-dashed border-gray-300 p-3 text-xs leading-snug opacity-80">
                    <div className="text-center border-b border-dashed border-gray-300 pb-2 mb-2">
                      <p className="text-sm font-bold tracking-wider text-gray-700">LAPORAN HARIAN</p>
                    </div>
                    <div className="mb-2 text-gray-600 space-y-0.5">
                      <div className="flex">
                        <span className="w-14 text-gray-400">Lapak</span>
                        <span className="font-semibold">: {r.nama_lapak}</span>
                      </div>
                      <div className="flex">
                        <span className="w-14 text-gray-400">Tanggal</span>
                        <span className="truncate">: {new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="border-t border-dashed border-gray-300 pt-1.5 mb-1.5 space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Omset Kotor</span>
                        <span className="font-semibold text-gray-700">Rp {r.omset_kotor.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gaji Kru</span>
                        <span className="font-semibold text-gray-700">Rp {r.gaji_kru.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Item Terjual</span>
                        <span className="font-semibold text-gray-700">{r.item_terjual}</span>
                      </div>
                    </div>
                    <div className="border-t-2 border-dashed border-gray-300 pt-1.5 mt-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-gray-700">OMSET BERSIH</span>
                        <span className="font-bold text-gray-700">Rp {r.omset_bersih.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
