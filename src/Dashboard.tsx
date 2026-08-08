import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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

type ViewMode = 'bulanan' | 'tahunan'

const CACHE_KEY = 'kebab_dashboard'

export default function Dashboard() {
  const [reports, setReports] = useState<ClosingReport[]>(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('bulanan')

  useEffect(() => {
    supabase
      .from('closing_reports')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setReports(data as ClosingReport[])
          localStorage.setItem(CACHE_KEY, JSON.stringify(data))
        }
        setLoading(false)
      })
  }, [])

  const monthlyMap: Record<string, { label: string; omsetKotor: number; omsetBersih: number; itemTerjual: number; count: number }> = {}
  const yearlyMap: Record<string, { label: string; omsetKotor: number; omsetBersih: number; itemTerjual: number; count: number }> = {}
  for (const r of reports) {
    const d = new Date(r.tanggal)
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const mLabel = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })
    if (!monthlyMap[mKey]) {
      monthlyMap[mKey] = { label: mLabel, omsetKotor: 0, omsetBersih: 0, itemTerjual: 0, count: 0 }
    }
    monthlyMap[mKey].omsetKotor += r.omset_kotor
    monthlyMap[mKey].omsetBersih += r.omset_bersih
    monthlyMap[mKey].itemTerjual += r.item_terjual
    monthlyMap[mKey].count++

    const yKey = String(d.getFullYear())
    if (!yearlyMap[yKey]) {
      yearlyMap[yKey] = { label: yKey, omsetKotor: 0, omsetBersih: 0, itemTerjual: 0, count: 0 }
    }
    yearlyMap[yKey].omsetKotor += r.omset_kotor
    yearlyMap[yKey].omsetBersih += r.omset_bersih
    yearlyMap[yKey].itemTerjual += r.item_terjual
    yearlyMap[yKey].count++
  }
  const chartData = view === 'bulanan' ? Object.values(monthlyMap) : Object.values(yearlyMap)

  const totalOmsetKotor = reports.reduce((s, r) => s + r.omset_kotor, 0)
  const totalOmsetBersih = reports.reduce((s, r) => s + r.omset_bersih, 0)
  const totalItems = reports.reduce((s, r) => s + r.item_terjual, 0)

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900">Grafik</h1>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('bulanan')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${view === 'bulanan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setView('tahunan')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${view === 'tahunan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tahunan
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500">Belum ada data closing.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Total Laporan</p>
                <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Omset Kotor</p>
                <p className="text-2xl font-bold text-orange-600">Rp {totalOmsetKotor.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Omset Bersih</p>
                <p className="text-2xl font-bold text-green-600">Rp {totalOmsetBersih.toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-500">Total Item Terjual</p>
                <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Tren Omset Bersih</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={12} tick={{ fill: '#6b7280' }} />
                    <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="omsetBersih" stroke="#16a34a" strokeWidth={2} name="Omset Bersih" dot={{ fill: '#16a34a' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Omset Kotor vs Bersih</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={12} tick={{ fill: '#6b7280' }} />
                    <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="omsetKotor" fill="#f97316" name="Omset Kotor" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="omsetBersih" fill="#16a34a" name="Omset Bersih" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Item Terjual</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} tick={{ fill: '#6b7280' }} />
                  <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="itemTerjual" fill="#3b82f6" name="Item Terjual" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Ringkasan {view === 'bulanan' ? 'Bulanan' : 'Tahunan'}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">{view === 'bulanan' ? 'Bulan' : 'Tahun'}</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">Laporan</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">Omset Kotor</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">Omset Bersih</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">Item Terjual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((d) => (
                      <tr key={d.label} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-800">{d.label}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{d.count}</td>
                        <td className="px-3 py-2 text-right text-orange-600">Rp {d.omsetKotor.toLocaleString('id-ID')}</td>
                        <td className="px-3 py-2 text-right text-green-600">Rp {d.omsetBersih.toLocaleString('id-ID')}</td>
                        <td className="px-3 py-2 text-right text-blue-600">{d.itemTerjual}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
