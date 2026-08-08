import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { listLapak, lapakLabel, type Lapak } from './lib/lapak'
import Dashboard from './Dashboard'
import Grafik from './Grafik'
import History from './History'
import Layout, { type Page } from './Layout'
import StokNotice from './StokNotice'

interface StockItem {
  code: string
  name: string
  quantity: number
}

const defaultStock: StockItem[] = [
  { code: 'K', name: 'Kulit', quantity: 200 },
  { code: 'R', name: 'Roti', quantity: 100 },
  { code: 'T', name: 'Telor', quantity: 80 },
  { code: 'S', name: 'Sosis', quantity: 38 },
  { code: 'DS', name: 'Daging Sapi', quantity: 48 },
  { code: 'DA', name: 'Daging Ayam', quantity: 28 },
]

const itemPrices: Record<string, number> = {
  K: 3000,
  R: 4000,
  T: 4000,
  S: 8000,
  DS: 8000,
  DA: 8000,
}

const DRAFT_KEY = 'kebab_draft'

interface DraftState {
  total: number
  stock: StockItem[]
  stockAwal: StockItem[]
  jumlahKru: number
  gajiMode: 'auto' | 'jam'
  jamKerja: number
  tarifJam: number
  expenses: { name: string; amount: number }[]
  lapakName: string
}

function sanitizeStock(raw: unknown, fallback: StockItem[]): StockItem[] {
  if (!Array.isArray(raw)) return fallback
  return fallback.map((def) => {
    const found = (raw as StockItem[]).find((s) => s && s.code === def.code)
    const q = found?.quantity
    return typeof q === 'number' && Number.isFinite(q) ? { ...def, quantity: q } : def
  })
}

function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DraftState>
    if (!parsed || typeof parsed !== 'object') return null
    return {
      total: typeof parsed.total === 'number' && Number.isFinite(parsed.total) ? parsed.total : 0,
      stock: sanitizeStock(parsed.stock, defaultStock),
      stockAwal: sanitizeStock(parsed.stockAwal, defaultStock),
      jumlahKru: typeof parsed.jumlahKru === 'number' && parsed.jumlahKru > 0 ? parsed.jumlahKru : 1,
      gajiMode: parsed.gajiMode === 'jam' ? 'jam' : 'auto',
      jamKerja: typeof parsed.jamKerja === 'number' && Number.isFinite(parsed.jamKerja) ? parsed.jamKerja : 0,
      tarifJam: typeof parsed.tarifJam === 'number' && Number.isFinite(parsed.tarifJam) ? parsed.tarifJam : 10000,
      expenses: Array.isArray(parsed.expenses)
        ? parsed.expenses.filter(
            (e) => e && typeof e.name === 'string' && typeof e.amount === 'number' && Number.isFinite(e.amount),
          )
        : [],
      lapakName: typeof parsed.lapakName === 'string' ? parsed.lapakName : '',
    }
  } catch {
    return null
  }
}

const OMSET_FLAT_THRESHOLD = 500000
const FLAT_GAJI_PER_ORANG = 50000
const PERSEN_GAJI = 10

export default function App() {
  const [draft] = useState<DraftState | null>(loadDraft)
  const [activePage, setActivePage] = useState<Page>(() => {
    const path = window.location.pathname
    if (path === '/dashboard') return 'dashboard'
    if (path === '/grafik') return 'grafik'
    if (path === '/riwayat') return 'riwayat'
    if (path === '/stok') return 'stok'
    if (path === '/catatan') return 'catatan'
    return 'beranda'
  })
  const [total, setTotal] = useState(draft?.total ?? 0)
  const [totalInput, setTotalInput] = useState<string | null>(null)
  const [stock, setStock] = useState<StockItem[]>(draft?.stock ?? defaultStock)
  const [stockAwal, setStockAwal] = useState<StockItem[]>(draft?.stockAwal ?? defaultStock)
  const [stockAwalInput, setStockAwalInput] = useState<Record<string, string>>({})
  const [stockSisaInput, setStockSisaInput] = useState<Record<string, string>>({})
  const [showClosing, setShowClosing] = useState(false)
  const [lapakName, setLapakName] = useState(draft?.lapakName ?? '')
  const [lapaks, setLapaks] = useState<Lapak[]>([])
  const [lapakFallback, setLapakFallback] = useState(false)
  const [sending, setSending] = useState(false)
  const [expenses, setExpenses] = useState<{ name: string; amount: number }[]>(draft?.expenses ?? [])
  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseFocus, setExpenseFocus] = useState(false)
  const [jumlahKru, setJumlahKru] = useState(draft?.jumlahKru ?? 1)
  const [kruInput, setKruInput] = useState<string | null>(null)
  const [gajiMode, setGajiMode] = useState<'auto' | 'jam'>(draft?.gajiMode ?? 'auto')
  const [jamKerja, setJamKerja] = useState(draft?.jamKerja ?? 0)
  const [jamInput, setJamInput] = useState<string | null>(null)
  const [tarifJam, setTarifJam] = useState(draft?.tarifJam ?? 10000)
  const [tarifInput, setTarifInput] = useState<string | null>(null)

  useEffect(() => {
    const data: DraftState = { total, stock, stockAwal, jumlahKru, gajiMode, jamKerja, tarifJam, expenses, lapakName }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  }, [total, stock, stockAwal, jumlahKru, gajiMode, jamKerja, tarifJam, expenses, lapakName])

  useEffect(() => {
    listLapak().then((list) => {
      if (list) setLapaks(list)
      else setLapakFallback(true)
    })
  }, [])

  const handleNavigate = (page: Page) => {
    setActivePage(page)
    const map: Record<Page, string> = {
      beranda: '/',
      stok: '/stok',
      catatan: '/catatan',
      dashboard: '/dashboard',
      grafik: '/grafik',
      riwayat: '/riwayat',
    }
    window.history.pushState(null, '', map[page])
  }

  const autoGajiMode: 'flat' | 'persen' = total <= OMSET_FLAT_THRESHOLD ? 'flat' : 'persen'
  const gaji = gajiMode === 'jam'
    ? Math.round((jamKerja * tarifJam) / 1000) * 1000
    : autoGajiMode === 'flat'
      ? FLAT_GAJI_PER_ORANG * jumlahKru
      : Math.round((total * (PERSEN_GAJI / 100)) / 1000) * 1000
  const totalPengeluaran = expenses.reduce((sum, e) => sum + e.amount, 0)
  const omsetBersih = total - gaji - totalPengeluaran

  const nilaiStok = stock.map((item, i) => {
    const awal = stockAwal[i]?.quantity ?? 0
    const terjual = Math.max(0, awal - item.quantity)
    const harga = itemPrices[item.code] ?? 0
    return { code: item.code, name: item.name, terjual, harga, nilai: terjual * harga }
  })
  const totalNilaiStok = nilaiStok.reduce((s, r) => s + r.nilai, 0)
  const itemTerjual = Math.round(nilaiStok.reduce((s, r) => s + r.terjual, 0) * 100) / 100

  const handleKirim = async () => {
    if (!lapakName.trim()) return
    setSending(true)
    const stokPayload = stockAwal.map((awal, i) => {
      const sisa = stock[i]?.quantity ?? 0
      return { name: awal.name, awal: awal.quantity, sisa, terjual: Math.max(0, awal.quantity - sisa), harga: itemPrices[awal.code] ?? 0 }
    })
    const namaLapak = lapakName.trim()
    const basePayload = {
      nama_lapak: namaLapak,
      tanggal: new Date().toISOString(),
      omset_kotor: total,
      gaji_kru: gaji,
      pengeluaran: expenses,
      total_pengeluaran: totalPengeluaran,
      omset_bersih: omsetBersih,
      item_terjual: itemTerjual,
    }
    try {
      const { error } = await supabase.from('closing_reports').insert([{ ...basePayload, stok: stokPayload }])
      if (error) {
        console.warn('Insert dengan stok gagal, coba tanpa stok:', error)
        const { error: fallbackError } = await supabase.from('closing_reports').insert([basePayload])
        if (fallbackError) throw fallbackError
      }
      alert(`Data "${namaLapak}" berhasil dikirim!`)
      setShowClosing(false)
      setTotal(0)
      setStock(defaultStock)
      setStockAwal(defaultStock)
      setJumlahKru(1)
      setGajiMode('auto')
      setJamKerja(0)
      setTarifJam(10000)
      setExpenses([])
      setLapakName('')
    } catch (err) {
      console.error('Gagal kirim closing:', err)
      const code = (err as { code?: string })?.code
      const detail = err instanceof Error ? err.message : 'unknown error'
      alert(`Gagal mengirim data${code ? ` (${code})` : ''}: ${detail}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout activePage={activePage} onNavigate={handleNavigate}>
      {activePage === 'dashboard' ? (
        <Dashboard />
      ) : activePage === 'grafik' ? (
        <Grafik />
      ) : activePage === 'riwayat' ? (
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <History />
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full bg-gray-50">
          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6">
              <div className="max-w-xl mx-auto space-y-4 pb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Input Closing</h2>
                  <p className="text-xs text-gray-400">Isi data shift hari ini sebelum dikirim.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Lapak</label>
                  {lapakFallback ? (
                    <input
                      type="text"
                      value={lapakName}
                      onChange={(e) => setLapakName(e.target.value)}
                      placeholder="Nama Lapak"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {lapaks.map((l) => {
                        const selected = lapakName === lapakLabel(l)
                        return (
                          <button
                            key={l.id}
                            onClick={() => setLapakName(selected ? '' : lapakLabel(l))}
                            className={`px-2 py-2 border text-sm font-medium rounded-md transition-colors cursor-pointer ${
                              selected
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {lapakLabel(l)}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Total Omset</label>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-800">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={totalInput !== null ? totalInput : total > 0 ? total.toLocaleString('id-ID') : ''}
                      onFocus={(e) => { if (total > 0) setTotalInput(String(Math.round(total / 1000))); e.target.select() }}
                      onChange={(e) => setTotalInput(e.target.value.replace(/[^\d]/g, ''))}
                      onBlur={() => { if (totalInput !== null) setTotal((parseInt(totalInput) || 0) * 1000); setTotalInput(null) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                      placeholder="0"
                      className="w-full text-3xl font-bold text-gray-900 text-center bg-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Gaji Kru</h3>
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                      <button
                        onClick={() => setGajiMode('auto')}
                        className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                          gajiMode === 'auto' ? 'bg-black text-white' : 'bg-white text-gray-600'
                        }`}
                      >
                        Otomatis
                      </button>
                      <button
                        onClick={() => setGajiMode('jam')}
                        className={`px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                          gajiMode === 'jam' ? 'bg-black text-white' : 'bg-white text-gray-600'
                        }`}
                      >
                        Per Jam
                      </button>
                    </div>
                  </div>
                  {gajiMode === 'jam' ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">Jam kerja</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={jamInput !== null ? jamInput : jamKerja > 0 ? String(jamKerja) : ''}
                          onFocus={(e) => { if (jamKerja > 0) setJamInput(String(jamKerja)); e.target.select() }}
                          onChange={(e) => setJamInput(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))}
                          onBlur={() => { if (jamInput !== null) setJamKerja(parseFloat(jamInput) || 0); setJamInput(null) }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                          placeholder="0"
                          className="w-20 text-center text-sm bg-white border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-gray-400"
                        />
                        <span className="text-xs text-gray-400">jam</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">Tarif/jam</span>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-1">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={tarifInput !== null ? tarifInput : tarifJam > 0 ? String(Math.round(tarifJam / 1000)) : ''}
                            onFocus={(e) => { if (tarifJam > 0) setTarifInput(String(Math.round(tarifJam / 1000))); e.target.select() }}
                            onChange={(e) => setTarifInput(e.target.value.replace(/[^\d]/g, ''))}
                            onBlur={() => { if (tarifInput !== null) setTarifJam((parseInt(tarifInput) || 0) * 1000); setTarifInput(null) }}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                            placeholder="10"
                            className="w-16 text-center text-sm bg-white border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-gray-400"
                          />
                          <span className="text-xs text-gray-400 ml-1">rb</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-500">Gaji Kru (Per Jam)</span>
                        <span className="text-sm font-bold text-green-600">Rp {gaji.toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {autoGajiMode === 'flat' && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">Jumlah kru</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={kruInput !== null ? kruInput : jumlahKru > 0 ? String(jumlahKru) : ''}
                            onFocus={(e) => { if (jumlahKru > 0) setKruInput(String(jumlahKru)); e.target.select() }}
                            onChange={(e) => setKruInput(e.target.value.replace(/[^\d]/g, ''))}
                            onBlur={() => { if (kruInput !== null) setJumlahKru(parseInt(kruInput) || 1); setKruInput(null) }}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                            placeholder="1"
                            className="w-14 text-center text-sm bg-white border border-gray-300 px-2 py-1.5 focus:outline-none focus:border-gray-400"
                          />
                          <span className="text-xs text-gray-400">orang</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-500">{autoGajiMode === 'flat' ? 'Gaji Kru (Flat Rp 50.000/orang)' : `Gaji Kru (${PERSEN_GAJI}% omset)`}</span>
                        <span className="text-sm font-bold text-green-600">Rp {gaji.toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Stok Bahan</h3>
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center text-xs text-gray-400 mb-1">
                    <span>Bahan</span>
                    <span className="w-14 text-center">Awal</span>
                    <span className="w-14 text-center">Sisa</span>
                    <span className="w-14 text-center">Terjual</span>
                    <span className="w-20 text-right">Nilai</span>
                  </div>
                  {stockAwal.map((item, i) => {
                    const sisa = stock[i]?.quantity ?? 0
                    const terjual = Math.max(0, item.quantity - sisa)
                    const harga = itemPrices[item.code] ?? 0
                    const nilai = terjual * harga
                    return (
                      <div key={item.code} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center py-1.5 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-700 truncate">{item.name}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={stockAwalInput[item.code] ?? item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setStockAwalInput((prev) => ({ ...prev, [item.code]: e.target.value }))}
                          onBlur={() => {
                            const val = stockAwalInput[item.code]
                            const num = val !== undefined ? (parseFloat(val) || 0) : item.quantity
                            setStockAwal((prev) => prev.map((s, idx) => (idx === i ? { ...s, quantity: num } : s)))
                            setStockAwalInput((prev) => { const next = { ...prev }; delete next[item.code]; return next })
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                          className="w-14 text-center text-sm bg-white border border-gray-300 rounded-md px-1 py-1 focus:outline-none focus:border-gray-400"
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          value={stockSisaInput[item.code] ?? sisa}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setStockSisaInput((prev) => ({ ...prev, [item.code]: e.target.value }))}
                          onBlur={() => {
                            const val = stockSisaInput[item.code]
                            const num = val !== undefined ? (parseFloat(val) || 0) : sisa
                            setStock((prev) => prev.map((s, idx) => (idx === i ? { ...s, quantity: num } : s)))
                            setStockSisaInput((prev) => { const next = { ...prev }; delete next[item.code]; return next })
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                          className="w-14 text-center text-sm bg-white border border-gray-300 rounded-md px-1 py-1 focus:outline-none focus:border-gray-400"
                        />
                        <span className="w-14 text-center text-sm font-bold text-gray-800">{terjual}</span>
                        <span className="w-20 text-right text-sm font-semibold text-gray-700">Rp {nilai.toLocaleString('id-ID')}</span>
                      </div>
                    )
                  })}
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center py-2 mt-1 border-t-2 border-gray-200">
                    <span className="text-sm font-bold text-gray-800">Total</span>
                    <span className="w-14" />
                    <span className="w-14" />
                    <span className="w-14 text-center text-sm font-bold text-gray-900">{itemTerjual}</span>
                    <span className="w-20 text-right text-sm font-bold text-green-600">Rp {totalNilaiStok.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Pengeluaran</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={expenseName}
                      onChange={(e) => setExpenseName(e.target.value)}
                      placeholder="Nama pengeluaran"
                      className="w-full sm:flex-1 min-w-0 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
                    />
                    <div className="flex flex-row-reverse gap-2">
                      <button
                        onClick={() => {
                          if (!expenseName.trim() || !expenseAmount.trim()) return
                          const num = (parseInt(expenseAmount) || 0) * 1000
                          if (num <= 0) return
                          setExpenses((prev) => [...prev, { name: expenseName.trim(), amount: num }])
                          setExpenseName('')
                          setExpenseAmount('')
                        }}
                        className="px-4 py-1.5 bg-white border-2 border-gray-800 text-gray-800 text-sm font-medium shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                      >
                        Tambah
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={expenseFocus ? expenseAmount : expenseAmount ? (parseInt(expenseAmount) * 1000).toLocaleString('id-ID') : ''}
                        onChange={(e) => setExpenseAmount(e.target.value.replace(/[^\d]/g, ''))}
                        onFocus={(e) => { setExpenseFocus(true); e.target.select() }}
                        onBlur={() => setExpenseFocus(false)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                        placeholder="Harga"
                        className="w-32 shrink-0 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-gray-400"
                      />
                    </div>
                  </div>
                  <div className="h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
                    {expenses.length === 0 ? (
                      <p className="text-sm text-gray-400">Belum ada pengeluaran...</p>
                    ) : (
                      expenses.map((exp, i) => (
                        <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-700">{i + 1}. {exp.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">Rp {exp.amount.toLocaleString('id-ID')}</span>
                            <button
                              onClick={() => setExpenses((prev) => prev.filter((_, idx) => idx !== i))}
                              className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {expenses.length > 0 && (
                    <div className="text-right mt-2">
                      <span className="text-sm text-gray-500">Total Pengeluaran: </span>
                      <span className="text-sm font-bold text-red-600">Rp {totalPengeluaran.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowClosing(true)}
                  className="w-full justify-center items-center px-4 py-3 bg-black text-white border border-black hover:bg-gray-800 active:bg-gray-900 transition-colors cursor-pointer text-sm font-semibold rounded-lg"
                >
                  Selesai Jual — Lihat Laporan
                </button>
              </div>
          </div>

          {showClosing && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setShowClosing(false)}>
              <div className="bg-white shadow-md w-full max-w-md max-h-[80vh] overflow-y-auto border border-black" onClick={(e) => e.stopPropagation()}>
                <div className="p-5">
                  <div className="text-center mb-4 border-b border-black pb-3">
                    <h2 className="text-lg font-bold text-black tracking-wide">LAPORAN HARIAN</h2>
                    <p className="text-xs text-black mt-1">
                      {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      {' • '}
                      {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {lapakFallback ? (
                    <div className="mb-4">
                      <label className="text-xs font-bold text-black block mb-1">Nama Lapak</label>
                      <input
                        type="text"
                        value={lapakName}
                        onChange={(e) => setLapakName(e.target.value)}
                        placeholder="Nama Lapak"
                        className="w-full border border-black px-2 py-1.5 text-sm text-black placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="text-xs font-bold text-black block mb-1">Lapak</label>
                      <div className="grid grid-cols-3 gap-2">
                        {lapaks.map((l) => {
                          const selected = lapakName === lapakLabel(l)
                          return (
                            <button
                              key={l.id}
                              onClick={() => setLapakName(selected ? '' : lapakLabel(l))}
                              className={`px-2 py-2 border text-sm font-medium transition-colors cursor-pointer ${
                                selected
                                  ? 'bg-black text-white border-black'
                                  : 'bg-white text-black border-black hover:bg-gray-100'
                              }`}
                            >
                              {lapakLabel(l)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <StokNotice />

                  <div className="border border-black overflow-hidden mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-black text-white">
                          <th className="text-left px-3 py-2 font-semibold">Bahan</th>
                          <th className="text-right px-3 py-2 font-semibold">Awal</th>
                          <th className="text-right px-3 py-2 font-semibold">Sisa</th>
                          <th className="text-right px-3 py-2 font-semibold">Terjual</th>
                        </tr>
                      </thead>
                    <tbody>
                      {stockAwal.map((awal, i) => {
                        const sisa = stock[i]?.quantity ?? 0
                        const terjual = Math.max(0, awal.quantity - sisa)
                        if (terjual === 0) return null
                        return (
                          <tr key={awal.code} className="border-t border-black">
                            <td className="px-3 py-2 text-black whitespace-nowrap">{awal.name}</td>
                            <td className="px-3 py-2 text-right text-black">{awal.quantity}</td>
                            <td className="px-3 py-2 text-right text-black">{sisa}</td>
                            <td className="px-3 py-2 text-right font-bold text-black">{terjual}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    </table>
                  </div>

                  <div className="border border-black p-3 mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-black">Omset Kotor</span>
                      <span className="font-bold text-black">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-black">
                        {gajiMode === 'jam'
                          ? `Gaji Kru (${jamKerja} jam × Rp ${(tarifJam / 1000).toLocaleString('id-ID')}.000)`
                          : autoGajiMode === 'flat'
                            ? `Gaji Kru (Flat Rp 50.000 × ${jumlahKru})`
                            : `Gaji Kru (${PERSEN_GAJI}% omset)`}
                      </span>
                      <span className="font-bold text-black">Rp {gaji.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-black">Item Terjual</span>
                      <span className="font-bold text-black">{itemTerjual}</span>
                    </div>
                    {expenses.length > 0 && (
                      <div className="border-t border-black pt-1.5 mt-1.5">
                        <p className="text-black font-semibold text-sm mb-1">Pengeluaran</p>
                        {expenses.map((e, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-black pl-1">{e.name}</span>
                            <span className="text-black">Rp {e.amount.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-black">Total Pengeluaran</span>
                          <span className="font-bold text-black">Rp {totalPengeluaran.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-0.5">
                          <span className="text-black">Gaji + Pengeluaran</span>
                          <span className="font-bold text-black">Rp {(gaji + totalPengeluaran).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    )}
                    <div className="border-t-2 border-black pt-2 mt-2 flex justify-between text-sm">
                      <span className="text-black font-bold">Omset Bersih</span>
                      <span className="font-bold text-black">Rp {omsetBersih.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="border border-black p-3 mb-4">
                    <p className="text-black font-bold text-sm mb-2">Nilai Stok Terjual</p>
                    <p className="text-xs text-black mb-2">Estimasi dari terjual × harga item</p>
                    <div className="space-y-1">
                      {nilaiStok.filter((row) => row.terjual > 0).map((row) => (
                        <div key={row.code} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-black min-w-0 truncate">{row.name}</span>
                          <span className="text-black shrink-0 whitespace-nowrap">{row.terjual} × Rp {row.harga.toLocaleString('id-ID')} = Rp {row.nilai.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-black pt-1.5 mt-1.5 flex justify-between text-sm">
                      <span className="text-black font-bold">Total</span>
                      <span className="font-bold text-black">Rp {totalNilaiStok.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowClosing(false)}
                      className="flex-1 px-4 py-2 bg-white text-black border border-black hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer text-sm font-medium"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={handleKirim}
                      disabled={!lapakName.trim() || sending}
                      className="flex-1 px-4 py-2 bg-black text-white border border-black hover:bg-gray-800 active:bg-gray-900 transition-colors cursor-pointer text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {sending ? 'Mengirim...' : 'Kirim'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
