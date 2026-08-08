import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import {
  getSavedPrinter,
  printReceipt,
  stokHarga,
  type ClosingReport,
  type SavedPrinter,
} from './lib/printer'
import { byLapakOrder, lapakLabel, lapakNo, listLapak, type Lapak } from './lib/lapak'
import StokNotice from './StokNotice'
import PrinterSettings from './PrinterSettings'

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function PrintIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Z" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

export function ReceiptCard({ report }: {
  report: ClosingReport
}) {
  const d = new Date(report.tanggal)
  const dateLine = d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeLine = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const stokValues = (report.stok ?? []).map((s) => {
    const harga = stokHarga(s)
    return { ...s, harga, nilai: s.terjual * harga }
  })
  const totalNilai = stokValues.reduce((sum, v) => sum + v.nilai, 0)
  return (
    <div className="bg-white shadow-md w-full max-w-xs border border-black p-3 text-xs leading-snug">
      <div className="text-center mb-2 border-b border-black pb-2">
        <h2 className="text-base font-bold text-black tracking-wide">LAPORAN HARIAN</h2>
        <p className="text-[10px] text-black mt-0.5">{dateLine} • {timeLine}</p>
      </div>
      <div className="mb-2">
        <label className="text-[10px] font-bold text-black block mb-0.5">Nama Lapak</label>
        <p className="border border-black px-2 py-1 text-black">{report.nama_lapak}</p>
      </div>
      {report.stok && report.stok.length > 0 && (
        <div className="border border-black overflow-hidden mb-2">
          <table className="w-full">
            <thead>
              <tr className="bg-black text-white">
                <th className="text-left px-2 py-1 font-semibold">Bahan</th>
                <th className="text-right px-2 py-1 font-semibold">Awal</th>
                <th className="text-right px-2 py-1 font-semibold">Sisa</th>
                <th className="text-right px-2 py-1 font-semibold">Terjual</th>
              </tr>
            </thead>
            <tbody>
              {report.stok.filter((s) => s.terjual > 0).map((s, i) => (
                <tr key={i} className="border-t border-black">
                  <td className="px-2 py-0.5 text-black whitespace-nowrap">{s.name}</td>
                  <td className="px-2 py-0.5 text-right text-black">{s.awal}</td>
                  <td className="px-2 py-0.5 text-right text-black">{s.sisa}</td>
                  <td className="px-2 py-0.5 text-right font-bold text-black">{s.terjual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {stokValues.length > 0 && (
        <div className="border border-black p-2 mb-2">
          <p className="text-black font-bold mb-0.5">Nilai Stok Terjual</p>
          <p className="text-[10px] text-black mb-1">Estimasi dari terjual × harga item</p>
          <div className="space-y-0.5">
            {stokValues.filter((s) => s.terjual > 0).map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-black">{s.name}</span>
                  <span className="block text-[10px] text-black truncate">{s.terjual.toLocaleString('id-ID')} × Rp {s.harga.toLocaleString('id-ID')}</span>
                </div>
                <span className="text-black font-bold">Rp {s.nilai.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-black pt-1 mt-1 flex items-center justify-between">
            <span className="font-semibold text-black">Total</span>
            <span className="font-bold text-black">Rp {totalNilai.toLocaleString('id-ID')}</span>
          </div>
        </div>
      )}
      <div className="border border-black p-2 mb-2">
        <div className="flex justify-between mb-0.5">
          <span className="text-black">Omset Kotor</span>
          <span className="font-bold text-black">Rp {report.omset_kotor.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between mb-0.5">
          <span className="text-black">Gaji Kru</span>
          <span className="font-bold text-black">Rp {report.gaji_kru.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between mb-0.5">
          <span className="text-black">Item Terjual</span>
          <span className="font-bold text-black">{report.item_terjual}</span>
        </div>
        {report.pengeluaran && report.pengeluaran.length > 0 && (
          <div className="border-t border-black pt-1 mt-1">
            <p className="text-black font-semibold mb-0.5">Pengeluaran</p>
            {report.pengeluaran.map((e, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-black pl-1">{e.name}</span>
                <span className="text-black">Rp {e.amount.toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div className="flex justify-between mt-0.5">
              <span className="text-black">Total Pengeluaran</span>
              <span className="font-bold text-black">Rp {report.total_pengeluaran.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black">Gaji + Pengeluaran</span>
              <span className="font-bold text-black">Rp {(report.gaji_kru + report.total_pengeluaran).toLocaleString('id-ID')}</span>
            </div>
          </div>
        )}
        <div className="border-t-2 border-black pt-1 mt-1 flex justify-between">
          <span className="text-black font-bold">Omset Bersih</span>
          <span className="font-bold text-black">Rp {report.omset_bersih.toLocaleString('id-ID')}</span>
        </div>
      </div>
    </div>
  )
}

function ReceiptItem({ report, onPrint, onDelete }: {
  report: ClosingReport
  onPrint: () => void
  onDelete: () => void
}) {
  return (
    <div className="w-full max-w-xs justify-self-center">
      <ReceiptCard report={report} />
      <div className="mt-2 flex justify-end items-center gap-2 no-print">
        <button
          onClick={onDelete}
          title="Hapus"
          className="p-1.5 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <TrashIcon />
        </button>
        <button
          onClick={onPrint}
          className="px-3 py-1 bg-black text-white text-xs font-medium hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Cetak
        </button>
      </div>
    </div>
  )
}

const CACHE_KEY = 'kebab_laporan'

const todayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const PAGI_CUTOFF_HOUR = 15
const SHIFT_NAMES = ['Pagi', 'Sore'] as const

const shiftSlot = (tanggal: string): 'pagi' | 'sore' =>
  new Date(tanggal).getHours() < PAGI_CUTOFF_HOUR ? 'pagi' : 'sore'

export default function Laporan() {
  const [reports, setReports] = useState<ClosingReport[]>(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return []
    const list = JSON.parse(cached) as ClosingReport[]
    return [...list].sort(byLapakOrder)
  })
  const [lapaks, setLapaks] = useState<Lapak[]>([])
  const [lapakMode, setLapakMode] = useState<'loading' | 'ok' | 'fallback'>('loading')
  const [loading, setLoading] = useState(true)
  const [printingAll, setPrintingAll] = useState(false)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [unknownOpen, setUnknownOpen] = useState(false)
  const [printerOpen, setPrinterOpen] = useState(false)
  const [savedPrinter, setSavedPrinter] = useState<SavedPrinter | null>(() => getSavedPrinter())
  const [search, setSearch] = useState('')

  const refreshPrinter = () => setSavedPrinter(getSavedPrinter())

  const loadReports = useCallback(() => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    supabase
      .from('closing_reports')
      .select('*')
      .or('archived.is.null,archived.eq.false')
      .then(({ data, error }) => {
        if (!error && data) {
          const todayReports = (data as ClosingReport[]).filter((r) => r.tanggal.slice(0, 10) === todayStr)
          setReports(todayReports.sort(byLapakOrder))
          localStorage.setItem(CACHE_KEY, JSON.stringify(todayReports))
        }
        setLoading(false)
      })
  }, [])

  const archiveOldReports = useCallback(() => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    supabase
      .from('closing_reports')
      .update({ archived: true })
      .or('archived.is.null,archived.eq.false')
      .lt('tanggal', `${todayStr}T00:00:00`)
      .then(({ error }) => {
        if (error) console.warn('Gagal arsip otomatis laporan lama:', error.message)
      })
  }, [])

  const loadLapaks = useCallback(() => {
    listLapak().then((list) => {
      if (list) {
        setLapaks(list)
        setLapakMode('ok')
      } else {
        setLapakMode('fallback')
      }
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    loadReports()
    archiveOldReports()
    loadLapaks()
    const id = setInterval(() => {
      loadReports()
      archiveOldReports()
      loadLapaks()
    }, 10000)
    return () => clearInterval(id)
  }, [loadReports, archiveOldReports, loadLapaks])

  const byNo = new Map<number, ClosingReport[]>()
  const unknown: ClosingReport[] = []
  for (const r of reports) {
    const no = lapakNo(r.nama_lapak)
    if (Number.isFinite(no)) {
      const arr = byNo.get(no) ?? []
      arr.push(r)
      byNo.set(no, arr)
    } else {
      unknown.push(r)
    }
  }
  for (const arr of byNo.values()) arr.sort((a, b) => a.created_at.localeCompare(b.created_at))
  unknown.sort((a, b) => a.created_at.localeCompare(b.created_at))

  const tk = todayKey(new Date())
  const slotCounts = new Map<number, { pagi: number; sore: number }>()
  for (const r of reports) {
    if (todayKey(new Date(r.tanggal)) !== tk) continue
    const no = lapakNo(r.nama_lapak)
    if (!Number.isFinite(no)) continue
    const cur = slotCounts.get(no) ?? { pagi: 0, sore: 0 }
    cur[shiftSlot(r.tanggal)] += 1
    slotCounts.set(no, cur)
  }

  const toggle = (no: number) => setExpanded((prev) => ({ ...prev, [no]: !prev[no] }))

  const archiveReport = useCallback(async (report: ClosingReport) => {
    const { error } = await supabase.from('closing_reports').update({ archived: true }).eq('id', report.id)
    if (error) return error
    setReports((prev) => {
      const next = prev.filter((r) => r.id !== report.id)
      localStorage.setItem(CACHE_KEY, JSON.stringify(next))
      return next
    })
    return null
  }, [])

  const handlePrintOne = async (report: ClosingReport) => {
    const printer = getSavedPrinter()
    if (!printer) {
      alert('Belum ada printer tersimpan. Klik ikon gear di kanan atas untuk mengatur printer.')
      return
    }
    try {
      await printReceipt(report, printer)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal mencetak.')
      return
    }
    const err = await archiveReport(report)
    if (err) console.warn('Gagal arsip setelah cetak:', err.message)
  }

  const handleDoneAll = async () => {
    if (reports.length === 0) return
    if (!confirm(`Tandai semua ${reports.length} laporan selesai dan pindah ke riwayat?`)) return
    const ids = reports.map((r) => r.id)
    const { error } = await supabase.from('closing_reports').update({ archived: true }).in('id', ids)
    if (error) {
      alert('Gagal menandai selesai: ' + error.message)
      return
    }
    setReports([])
    localStorage.setItem(CACHE_KEY, JSON.stringify([]))
  }

  const handleDelete = async (report: ClosingReport) => {
    if (!confirm(`Hapus laporan "${report.nama_lapak}" ${new Date(report.tanggal).toLocaleString('id-ID')}? Data akan dihapus permanen.`)) return
    const { error } = await supabase.from('closing_reports').delete().eq('id', report.id)
    if (error) { alert('Gagal menghapus: ' + error.message); return }
    setReports((prev) => {
      const next = prev.filter((r) => r.id !== report.id)
      localStorage.setItem(CACHE_KEY, JSON.stringify(next))
      return next
    })
  }

  const handlePrintAll = async () => {
    const printer = getSavedPrinter()
    if (!printer) {
      alert('Belum ada printer tersimpan. Klik ikon gear di kanan atas untuk mengatur printer.')
      return
    }
    setPrintingAll(true)
    let failed = 0
    try {
      for (const r of reports) {
        try {
          await printReceipt(r, printer)
        } catch (e) {
          failed++
          console.warn('Cetak gagal:', r.nama_lapak, e)
        }
      }
    } finally {
      setPrintingAll(false)
    }
    if (failed > 0) alert(`Selesai. ${failed} laporan gagal dicetak.`)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-bold text-gray-900">Laporan</h1>
        <div className="flex items-center gap-2">
          {savedPrinter && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] text-gray-500 bg-white border border-gray-200 px-2 py-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="max-w-[140px] truncate">{savedPrinter.name}</span>
            </span>
          )}
          <button
            onClick={() => { refreshPrinter(); setPrinterOpen(true) }}
            title="Pengaturan printer"
            className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 shadow-sm transition-colors cursor-pointer"
          >
            <GearIcon />
          </button>
          <button
            onClick={handleDoneAll}
            disabled={reports.length === 0}
            title="Tandai semua selesai dan pindah ke riwayat"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-semibold tracking-wide shadow-sm hover:bg-green-700 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Done
          </button>
          <button
            onClick={handlePrintAll}
            disabled={printingAll || reports.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-semibold tracking-wide shadow-sm hover:bg-gray-800 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PrintIcon />
            {printingAll ? 'Mencetak...' : 'Cetak'}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">{reports.length} laporan closing masuk</p>

      <StokNotice />

      <div className="mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama lapak..."
          className="w-full text-sm border border-gray-200 px-3 py-2 bg-white focus:outline-none focus:border-gray-400"
        />
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-400">Memuat data...</p>
        </div>
      ) : lapakMode === 'ok' ? (
        <div className="space-y-2">
          {lapaks.filter((l) => {
            if (!search) return true
            const list = byNo.get(l.no) ?? []
            return list.some((r) => r.nama_lapak.toLowerCase().includes(search.toLowerCase())) || lapakLabel(l).toLowerCase().includes(search.toLowerCase())
          }).map((l) => {
            const list = byNo.get(l.no) ?? []
            const sc = slotCounts.get(l.no) ?? { pagi: 0, sore: 0 }
            const open = search ? true : expanded[l.no]
            return (
              <div key={l.id} className="bg-white border border-gray-200 shadow-sm">
                <button
                  onClick={() => toggle(l.no)}
                  className="w-full flex items-center justify-between px-3 py-2.5 transition-colors cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-gray-800">{lapakLabel(l)}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      {Array.from({ length: Math.max(1, l.shift) }).map((_, i) => {
                        const slot = SHIFT_NAMES[i]
                        const filled = (i === 0 ? sc.pagi : sc.sore) > 0
                        return (
                          <span key={i} className="flex items-center gap-1">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${filled ? 'bg-green-500' : 'bg-gray-300'}`}
                            />
                            {slot && <span className="text-[10px] text-gray-500">{slot}</span>}
                          </span>
                        )
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                    <span>{list.length} laporan</span>
                    <span className={`inline-block transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>
                {open && (
                  <div className="p-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {list.length === 0 ? (
                      <p className="text-xs text-gray-400">Belum ada laporan.</p>
                    ) : (
                      list.map((r) => (
                        <ReceiptItem key={r.id} report={r} onPrint={() => handlePrintOne(r)} onDelete={() => handleDelete(r)} />
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {unknown.length > 0 && (
            <div className="bg-white border border-gray-200 shadow-sm">
              <button
                onClick={() => setUnknownOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 transition-colors cursor-pointer hover:bg-gray-50"
              >
                <span className="text-sm font-bold text-gray-800">Lainnya</span>
                <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                  <span>{unknown.length} laporan</span>
                  <span className={`inline-block transition-transform ${unknownOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>
              {unknownOpen && (
                <div className="p-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unknown.map((r) => (
                    <ReceiptItem key={r.id} report={r} onPrint={() => handlePrintOne(r)} onDelete={() => handleDelete(r)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-400">Belum ada laporan masuk.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.filter((r) => !search || r.nama_lapak.toLowerCase().includes(search.toLowerCase())).map((r) => (
            <ReceiptItem key={r.id} report={r} onPrint={() => handlePrintOne(r)} onDelete={() => handleDelete(r)} />
          ))}
        </div>
      )}

      <PrinterSettings
        open={printerOpen}
        onClose={() => setPrinterOpen(false)}
        onChanged={refreshPrinter}
      />
    </>
  )
}
