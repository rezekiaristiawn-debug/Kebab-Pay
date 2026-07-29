import { useState, useEffect } from 'react'
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

export default function Dashboard({ onBack }: { onBack: () => void }) {
  const [reports, setReports] = useState<ClosingReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('closing_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          alert('Gagal load data: ' + error.message)
        } else if (data) {
          setReports(data as ClosingReport[])
        }
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">Dashboard Closing</h1>
          <button
            onClick={onBack}
            className="text-sm px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer"
          >
            Kembali
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500">Belum ada data closing.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div key={r.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-800">{r.nama_lapak}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(r.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Omset Kotor</span>
                    <p className="font-semibold">Rp {r.omset_kotor.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Gaji Kru</span>
                    <p className="font-semibold">Rp {r.gaji_kru.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Pengeluaran</span>
                    <p className="font-semibold">Rp {r.total_pengeluaran.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Omset Bersih</span>
                    <p className="font-bold text-green-700">Rp {r.omset_bersih.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Item terjual: {r.item_terjual}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
