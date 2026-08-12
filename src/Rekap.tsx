import type { ClosingReport } from './lib/printer'

export type ViewMode = 'harian' | 'mingguan' | 'bulanan' | 'tahunan'

export const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'harian', label: 'Harian' },
  { id: 'mingguan', label: 'Mingguan' },
  { id: 'bulanan', label: 'Bulanan' },
  { id: 'tahunan', label: 'Tahunan' },
]

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
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

const chartWindow = (view: ViewMode, now: Date): { start: Date; steps: number } => {
  if (view === 'harian') return { start: addDays(startOfDay(now), -13), steps: 14 }
  if (view === 'mingguan') return { start: addDays(startOfWeek(now), -77), steps: 12 }
  if (view === 'bulanan') return { start: addMonths(startOfMonth(now), -11), steps: 12 }
  return { start: addYears(startOfYear(now), -5), steps: 6 }
}

interface Row {
  key: string
  label: string
  count: number
  omsetKotor: number
  gaji: number
  pengeluaran: number
  omsetBersih: number
  itemTerjual: number
}

const moneyFormat = (n: number) => 'Rp ' + n.toLocaleString('id-ID')
const emptyRow = (key: string, label: string): Row => ({ key, label, count: 0, omsetKotor: 0, gaji: 0, pengeluaran: 0, omsetBersih: 0, itemTerjual: 0 })

export function RekapTable({ view, reports }: { view: ViewMode; reports: ClosingReport[] }) {
  const now = new Date()
  const sFn = startOf(view)
  const aFn = advance(view)

  const map = new Map<string, Row>()
  for (const r of reports) {
    const s = sFn(new Date(r.tanggal))
    const key = bucketKey(view, s)
    let b = map.get(key)
    if (!b) {
      b = emptyRow(key, bucketLabel(view, s))
      map.set(key, b)
    }
    b.count += 1
    b.omsetKotor += r.omset_kotor ?? 0
    b.gaji += r.gaji_kru ?? 0
    b.pengeluaran += r.total_pengeluaran ?? 0
    b.omsetBersih += r.omset_bersih ?? 0
    b.itemTerjual += r.item_terjual ?? 0
  }

  const { start, steps } = chartWindow(view, now)
  const rows: Row[] = []
  let cursor = new Date(start)
  for (let i = 0; i < steps; i++) {
    const key = bucketKey(view, cursor)
    const b = map.get(key)
    if (b && b.count > 0) rows.push(b)
    cursor = aFn(cursor)
  }

  const total = rows.reduce<Row>(
    (acc, r) => ({
      ...acc,
      count: acc.count + r.count,
      omsetKotor: acc.omsetKotor + r.omsetKotor,
      gaji: acc.gaji + r.gaji,
      pengeluaran: acc.pengeluaran + r.pengeluaran,
      omsetBersih: acc.omsetBersih + r.omsetBersih,
      itemTerjual: acc.itemTerjual + r.itemTerjual,
    }),
    emptyRow('total', 'Total'),
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-3 py-2 font-semibold text-gray-600">Periode</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Laporan</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Omset Kotor</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Gaji</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Pengeluaran</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Omset Bersih</th>
            <th className="text-right px-3 py-2 font-semibold text-gray-600">Item</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-800">{r.label}</td>
              <td className="px-3 py-2 text-right text-gray-600">{r.count}</td>
              <td className="px-3 py-2 text-right text-gray-900">{moneyFormat(r.omsetKotor)}</td>
              <td className="px-3 py-2 text-right text-gray-900">{moneyFormat(r.gaji)}</td>
              <td className="px-3 py-2 text-right text-gray-900">{moneyFormat(r.pengeluaran)}</td>
              <td className="px-3 py-2 text-right text-gray-900">{moneyFormat(r.omsetBersih)}</td>
              <td className="px-3 py-2 text-right text-black">{Math.round(r.itemTerjual)}</td>
            </tr>
          ))}
          {rows.length > 0 && (
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td className="px-3 py-2 font-bold text-gray-900">{total.label}</td>
              <td className="px-3 py-2 text-right font-bold text-gray-900">{total.count}</td>
              <td className="px-3 py-2 text-right font-bold text-gray-900">{moneyFormat(total.omsetKotor)}</td>
              <td className="px-3 py-2 text-right font-bold text-gray-900">{moneyFormat(total.gaji)}</td>
              <td className="px-3 py-2 text-right font-bold text-gray-900">{moneyFormat(total.pengeluaran)}</td>
              <td className="px-3 py-2 text-right font-bold text-emerald-600">{moneyFormat(total.omsetBersih)}</td>
              <td className="px-3 py-2 text-right font-bold text-gray-900">{Math.round(total.itemTerjual)}</td>
            </tr>
          )}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-sm text-gray-400 p-3">Tidak ada data pada rentang ini.</p>}
    </div>
  )
}
