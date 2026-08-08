import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Laporan from './Laporan'

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

const CACHE_KEY = 'kebab_dashboard'

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'harian', label: 'Harian' },
  { id: 'mingguan', label: 'Mingguan' },
  { id: 'bulanan', label: 'Bulanan' },
  { id: 'tahunan', label: 'Tahunan' },
]

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const startOfWeek = (d: Date) => {
  const s = startOfDay(d)
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7))
  return s
}
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const startOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1)

const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const startOf = (view: ViewMode): (d: Date) => Date => {
  if (view === 'harian') return startOfDay
  if (view === 'mingguan') return startOfWeek
  if (view === 'bulanan') return startOfMonth
  return startOfYear
}

const bucketKey = (view: ViewMode, start: Date): string => {
  if (view === 'harian' || view === 'mingguan') return isoLocal(start)
  if (view === 'bulanan') return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
  return String(start.getFullYear())
}

const PERIOD_CAPTION: Record<ViewMode, string> = {
  harian: 'Hari Ini',
  mingguan: 'Minggu Ini',
  bulanan: 'Bulan Ini',
  tahunan: 'Tahun Ini',
}

const periodLabel = (view: ViewMode, now: Date): string => {
  if (view === 'harian') return `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  if (view === 'mingguan') {
    const s = startOfWeek(now)
    const e = new Date(s); e.setDate(e.getDate() + 6)
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

interface Bucket {
  key: string
  label: string
  omsetKotor: number
  omsetBersih: number
  itemTerjual: number
  count: number
}

const moneyFormat = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

export default function Dashboard() {

  const [reports, setReports] = useState<ClosingReport[]>(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('harian')

  const load = useCallback(() => {
    supabase
      .from('closing_reports')
      .select('*')
      .or('archived.is.null,archived.eq.false')
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

  const map = new Map<string, Bucket>()
  for (const r of reports) {
    const s = sFn(new Date(r.tanggal))
    const key = bucketKey(view, s)
    let b = map.get(key)
    if (!b) {
      b = { key, label: PERIOD_CAPTION[view], omsetKotor: 0, omsetBersih: 0, itemTerjual: 0, count: 0 }
      map.set(key, b)
    }
    b.omsetKotor += r.omset_kotor
    b.omsetBersih += r.omset_bersih
    b.itemTerjual += r.item_terjual
    b.count += 1
  }

  const curKey = bucketKey(view, sFn(now))
  const current = map.get(curKey) ?? { key: curKey, label: PERIOD_CAPTION[view], omsetKotor: 0, omsetBersih: 0, itemTerjual: 0, count: 0 }

  const cards = [
    { label: 'Laporan', value: String(current.count), card: 'bg-white border-gray-200', badge: 'bg-gray-100 text-gray-700', valueCls: 'text-gray-900' },
    { label: 'Omset Kotor', value: moneyFormat(current.omsetKotor), card: 'bg-white border-gray-200', badge: 'bg-gray-100 text-gray-700', valueCls: 'text-gray-900' },
    { label: 'Omset Bersih', value: moneyFormat(current.omsetBersih), card: 'bg-white border-gray-200', badge: 'bg-gray-100 text-gray-700', valueCls: 'text-gray-900' },
    { label: 'Item Terjual', value: String(current.itemTerjual), card: 'bg-white border-gray-200', badge: 'bg-gray-100 text-gray-700', valueCls: 'text-gray-900' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gradient-to-br from-slate-100 via-sky-50 to-emerald-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
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
            <p className="text-sm text-gray-400">Belum ada data closing. Kirim closing dari halaman Beranda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((c) => (
              <div key={c.label} className={`${c.card} border shadow-sm p-4 min-w-0`}>
                <p className={`text-xs font-semibold inline-block px-2 py-0.5 ${c.badge}`}>
                  {c.label} · {PERIOD_CAPTION[view]}
                </p>
                <p className={`text-2xl font-bold mt-2 break-words ${c.valueCls}`}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border border-gray-200 shadow-sm p-4 sm:p-6">
          <Laporan />
        </div>
      </div>
    </div>
  )
}
