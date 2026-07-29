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

export default function History() {
  const [reports, setReports] = useState<ClosingReport[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    supabase
      .from('closing_reports')
      .select('*')
      .eq('archived', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          supabase.from('closing_reports').select('*').order('created_at', { ascending: false }).then(({ data: d2 }) => {
            if (d2) setReports(d2 as ClosingReport[])
            setLoading(false)
          })
          return
        }
        if (data) setReports(data as ClosingReport[])
        setLoading(false)
      })
  }, [])

  useEffect(() => { load() }, [load])

  const handleReset = async () => {
    if (!confirm('Reset semua history? Data akan dihapus permanen.')) return
    const ids = reports.map((r) => r.id)
    if (ids.length === 0) return
    const { error } = await supabase.from('closing_reports').delete().in('id', ids)
    if (error) { alert('Gagal reset: ' + error.message); return }
    setReports([])
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900">History</h1>
          <div className="flex items-center gap-2">
            {reports.length > 0 && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
            <p className="text-sm text-gray-400">{reports.length} laporan</p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500">Belum ada history.</p>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {reports.map((r) => (
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
                    <span className="text-gray-500">Gaji Kru (10%)</span>
                    <span className="font-semibold text-gray-700">Rp {r.gaji_kru.toLocaleString('id-ID')}</span>
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
        )}
      </div>
    </div>
  )
}
