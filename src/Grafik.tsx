import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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

type ViewMode = 'harian' | 'mingguan' | 'bulanan' | 'tahunan'

const CACHE_KEY = 'kebab_grafik'

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'harian', label: 'Harian' },
  { id: 'mingguan', label: 'Mingguan' },
  { id: 'bulanan', label: 'Bulanan' },
  { id: 'tahunan', label: 'Tahunan' },
]

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const startOfWeek = (d: Date) => {
  const s = startOfDay(d)
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7))
  return s
}
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const startOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1)

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const addMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
const addYears = (d: Date, n: number) => { const x = new Date(d); x.setFullYear(x.getFullYear() + n); return x }

const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const startOf = (view: ViewMode): (d: Date) => Date => {
  if (view === 'harian') return startOfDay
  if (view === 'mingguan') return startOfWeek
  if (view === 'bulanan') return startOfMonth
  return startOfYear
}

const advance = (view: ViewMode): (d: Date) => Date => {
  if (view === 'harian') return (d) => addDays(d, 1)
  if (view === 'mingguan') return (d) => addDays(d, 7)
  if (view === 'bulanan') return (d) => addMonths(d, 1)
  return (d) => addYears(d, 1)
}

const bucketKey = (view: ViewMode, start: Date): string => {
  if (view === 'harian' || view === 'mingguan') return isoLocal(start)
  if (view === 'bulanan') return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
  return String(start.getFullYear())
}

const bucketLabel = (view: ViewMode, start: Date): string => {
  if (view === 'harian') return `${DAYS_SHORT[start.getDay()]} ${start.getDate()}/${start.getMonth() + 1}`
  if (view === 'mingguan') {
    const end = addDays(start, 6)
    if (start.getMonth() === end.getMonth()) return `${start.getDate()}\u2013${end.getDate()} ${MONTHS_SHORT[start.getMonth()]}`
    return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]}\u2013${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`
  }
  if (view === 'bulanan') return `${MONTHS_SHORT[start.getMonth()]} ${String(start.getFullYear()).slice(2)}`
  return String(start.getFullYear())
}

const periodLabel = (view: ViewMode, now: Date): string => {
  if (view === 'harian') return `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  if (view === 'mingguan') {
    const s = startOfWeek(now)
    const e = addDays(s, 6)
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.getDate()}\u2013${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`
    }
    if (s.getFullYear() === e.getFullYear()) {
      return `${s.getDate()} ${MONTHS[s.getMonth()]} \u2013 ${e.getDate()} ${MONTHS[e.getMonth()]} ${s.getFullYear()}`
    }
    return `${s.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}\u2013${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`
  }
  if (view === 'bulanan') return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  return String(now.getFullYear())
}

const chartWindow = (view: ViewMode, now: Date): { start: Date; steps: number } => {
  if (view === 'harian') return { start: addDays(startOfDay(now), -13), steps: 14 }
  if (view === 'mingguan') return { start: addDays(startOfWeek(now), -77), steps: 12 }
  if (view === 'bulanan') return { start: addMonths(startOfMonth(now), -11), steps: 12 }
  return { start: addYears(startOfYear(now), -5), steps: 6 }
}

interface Bucket {
  key: string
  label: string
  omsetKotor: number
  omsetBersih: number
  itemTerjual: number
  count: number
}

const moneyFormat = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

const compactRupiah = (v: number) => {
  if (v >= 1_000_000) {
    const jt = v / 1_000_000
    return `${Number.isInteger(jt) ? jt : jt.toFixed(1)}jt`
  }
  if (v >= 1_000) return `${Math.round(v / 1_000)}rb`
  return String(v)
}

function AggChart({ data }: { data: Bucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={280} initialDimension={{ width: 600, height: 280 }}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="label" fontSize={11} tick={{ fill: '#6b7280' }} interval="preserveStartEnd" />
        <YAxis fontSize={11} tick={{ fill: '#6b7280' }} tickFormatter={compactRupiah} width={44} />
        <Tooltip
          formatter={(value, name) => {
            const v = typeof value === 'number' ? value : Number(value)
            if (name === 'Omset Kotor' || name === 'Omset Bersih') return [moneyFormat(v), name]
            return [v, name]
          }}
          labelStyle={{ color: '#374151' }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="omsetKotor" name="Omset Kotor" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="omsetBersih" name="Omset Bersih" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function Grafik() {

  const [reports, setReports] = useState<ClosingReport[]>(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('harian')
  const [showSummary] = useState(false)

  const load = useCallback(() => {
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

  useEffect(() => {
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [load])

  const now = new Date()
  const sFn = startOf(view)
  const aFn = advance(view)

  const map = new Map<string, Bucket>()
  for (const r of reports) {
    const s = sFn(new Date(r.tanggal))
    const key = bucketKey(view, s)
    let b = map.get(key)
    if (!b) {
      b = { key, label: bucketLabel(view, s), omsetKotor: 0, omsetBersih: 0, itemTerjual: 0, count: 0 }
      map.set(key, b)
    }
    b.omsetKotor += r.omset_kotor
    b.omsetBersih += r.omset_bersih
    b.itemTerjual += r.item_terjual
    b.count += 1
  }

  const { start, steps } = chartWindow(view, now)
  const chartData: Bucket[] = []
  let cursor = new Date(start)
  for (let i = 0; i < steps; i++) {
    const key = bucketKey(view, cursor)
    const b = map.get(key)
    chartData.push(b ?? { key, label: bucketLabel(view, cursor), omsetKotor: 0, omsetBersih: 0, itemTerjual: 0, count: 0 })
    cursor = aFn(cursor)
  }

  const tableData = chartData.filter((b) => b.count > 0)

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gradient-to-br from-slate-100 via-sky-50 to-emerald-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Grafik</h1>
            <p className="text-xs text-gray-500 mt-0.5">{periodLabel(view, now)}</p>
          </div>
          <div className="flex bg-white border border-gray-200 p-0.5 shadow-sm">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  view === v.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white/80 border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-400">Memuat data...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white/80 border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-400">Belum ada data closing.</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 shadow-sm p-4 mb-6 min-w-0">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-black inline-block" />
                Tren Omset
              </h2>
              <AggChart data={chartData} />
            </div>

            {showSummary && (
            <div className="bg-white border border-gray-200 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 inline-block" />
                Ringkasan {VIEWS.find((v) => v.id === view)?.label}
              </h2>
              {tableData.length === 0 ? (
                <p className="text-sm text-gray-400">Tidak ada data pada rentang ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Periode</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-600">Laporan</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-600">Omset Kotor</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-600">Omset Bersih</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-600">Item Terjual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((d) => (
                        <tr key={d.key} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-800">{d.label}</td>
                          <td className="px-3 py-2 text-right text-gray-600">{d.count}</td>
                          <td className="px-3 py-2 text-right text-gray-900">{moneyFormat(d.omsetKotor)}</td>
                          <td className="px-3 py-2 text-right text-gray-900">{moneyFormat(d.omsetBersih)}</td>
                          <td className="px-3 py-2 text-right text-black">{d.itemTerjual}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
