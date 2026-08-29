import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { listLapak, lapakLabel, type Lapak } from './lib/lapak'
import Dashboard from './Dashboard'
import Grafik from './Grafik'
import History from './History'
import Layout, { type Page } from './Layout'
import StokNotice from './StokNotice'

interface MenuItem {
  id: number
  name: string
  price: string
  priceNum: number
  image: string
}

interface StockItem {
  code: string
  name: string
  quantity: number
}

interface RecipeIngredient {
  code: string
  amount: number
}

interface OrderLine {
  item: MenuItem
  deduct: RecipeIngredient[]
}

const defaultStock: StockItem[] = [
  { code: 'K', name: 'Kulit', quantity: 200 },
  { code: 'R', name: 'Roti', quantity: 100 },
  { code: 'T', name: 'Telor', quantity: 80 },
  { code: 'S', name: 'Sosis', quantity: 38 },
  { code: 'DS', name: 'Daging Sapi', quantity: 48 },
  { code: 'DA', name: 'Daging Ayam', quantity: 28 },
]

const menu: MenuItem[] = [
  { id: 1, name: 'Kebab Biasa', price: '6k', priceNum: 6000, image: '/asset/kebabbiasa.png' },
  { id: 2, name: 'Kebab Telor', price: '7k', priceNum: 7000, image: '/asset/kebabtelor.png' },
  { id: 3, name: 'Kebab Medium', price: '8k', priceNum: 8000, image: '/asset/kebabmedium.png' },
  { id: 4, name: 'Kebab Full Beef', price: '11k', priceNum: 11000, image: '/asset/kebabbeef.png' },
  { id: 6, name: 'Sosis Jumbo', price: '11k', priceNum: 11000, image: '/asset/kebabsosis.png' },
  { id: 7, name: 'Komplit', price: '11k', priceNum: 11000, image: '/asset/kebabkomplit.png' },
  { id: 5, name: 'Full Ayam', price: '11k', priceNum: 11000, image: '/asset/kebabayam.png' },
  { id: 13, name: 'Burger Telor', price: '8k', priceNum: 8000, image: '/asset/burgertelor.svg' },
  { id: 14, name: 'Burger Beef', price: '12k', priceNum: 12000, image: '/asset/burgerbeef.svg' },
  { id: 15, name: 'Burger Ayam', price: '12k', priceNum: 12000, image: '/asset/burgerayam.svg' },
  { id: 16, name: 'Burger Komplit', price: '12k', priceNum: 12000, image: '/asset/burgerkomplit.svg' },
]

const bahanMenu: MenuItem[] = [
  { id: 9, name: 'Telor', price: '4k', priceNum: 4000, image: '/asset/telor.png' },
  { id: 10, name: 'Sosis', price: '8k', priceNum: 8000, image: '/asset/sosis.png' },
  { id: 11, name: 'Daging Sapi', price: '8k', priceNum: 8000, image: '/asset/dagingSapi.png' },
  { id: 12, name: 'Daging Ayam', price: '8k', priceNum: 8000, image: '/asset/dagingAyam.png' },
]

const kejuMenu: MenuItem[] = [
  { id: 17, name: 'Keju Biasa', price: '2k', priceNum: 2000, image: '/asset/kejubiasa.svg' },
  { id: 18, name: 'Keju Mozarella', price: '3k', priceNum: 3000, image: '/asset/kejumozarella.svg' },
]

const menuRecipes: Record<number, RecipeIngredient[]> = {
  1: [{ code: 'S', amount: 0.25 }, { code: 'K', amount: 1 }],
  2: [{ code: 'T', amount: 1 }, { code: 'K', amount: 1 }],
  3: [{ code: 'DS', amount: 0.5 }, { code: 'K', amount: 1 }],
  4: [{ code: 'DS', amount: 1 }, { code: 'K', amount: 1 }],
  5: [{ code: 'DA', amount: 1 }, { code: 'K', amount: 1 }],
  6: [{ code: 'S', amount: 1 }, { code: 'K', amount: 1 }],
  7: [{ code: 'S', amount: 0.25 }, { code: 'DS', amount: 0.25 }, { code: 'T', amount: 1 }, { code: 'K', amount: 1 }],
  9: [{ code: 'T', amount: 1 }],
  10: [{ code: 'S', amount: 1 }],
  11: [{ code: 'DS', amount: 1 }],
  12: [{ code: 'DA', amount: 1 }],
  13: [{ code: 'R', amount: 1 }, { code: 'T', amount: 1 }],
  14: [{ code: 'R', amount: 1 }, { code: 'DS', amount: 1 }],
  15: [{ code: 'R', amount: 1 }, { code: 'DA', amount: 1 }],
  16: [{ code: 'R', amount: 1 }, { code: 'S', amount: 0.25 }, { code: 'DS', amount: 0.25 }],
  17: [],
  18: [],
}

const pieceIds = new Set([10, 11, 12])

function canFulfillOrder(menuId: number, stock: StockItem[]): boolean {
  const recipe = menuRecipes[menuId]
  if (!recipe) return false
  return recipe.every((ingredient) => {
    const stockItem = stock.find((s) => s.code === ingredient.code)
    return stockItem && stockItem.quantity >= ingredient.amount
  })
}

function deductStock(menuId: number, stock: StockItem[]): StockItem[] | null {
  if (!canFulfillOrder(menuId, stock)) return null
  const recipe = menuRecipes[menuId]
  return stock.map((item) => {
    const ingredient = recipe.find((r) => r.code === item.code)
    if (!ingredient) return item
    const newQty = Math.round((item.quantity - ingredient.amount) * 100) / 100
    return { ...item, quantity: newQty }
  })
}

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
  expenses: { name: string; amount: number }[]
  lapakName: string
  orderHistory: OrderLine[]
  notes: { name: string; price: string; priceNum: number }[]
}

function sanitizeStock(raw: unknown, fallback: StockItem[]): StockItem[] {
  if (!Array.isArray(raw)) return fallback
  return fallback.map((def) => {
    const found = (raw as StockItem[]).find((s) => s && s.code === def.code)
    const q = found?.quantity
    return typeof q === 'number' && Number.isFinite(q) ? { ...def, quantity: q } : def
  })
}

function sanitizeOrders(raw: unknown): OrderLine[] {
  if (!Array.isArray(raw)) return []
  const result: OrderLine[] = []
  for (const o of raw) {
    if (!o || typeof o !== 'object') continue
    const line = o as Partial<OrderLine>
    const item = line.item
    if (!item || typeof item.id !== 'number' || typeof item.name !== 'string') continue
    const deduct = Array.isArray(line.deduct)
      ? line.deduct.filter(
          (d) => d && typeof d.code === 'string' && typeof d.amount === 'number' && Number.isFinite(d.amount),
        )
      : []
    result.push({
      item: {
        id: item.id,
        name: item.name,
        price: typeof item.price === 'string' ? item.price : '',
        priceNum: typeof item.priceNum === 'number' && Number.isFinite(item.priceNum) ? item.priceNum : 0,
        image: typeof item.image === 'string' ? item.image : '',
      },
      deduct,
    })
  }
  return result
}

function sanitizeNotes(raw: unknown): { name: string; price: string; priceNum: number }[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (n) =>
      n && typeof n.name === 'string' && typeof n.price === 'string' && typeof n.priceNum === 'number' && Number.isFinite(n.priceNum),
  )
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
      expenses: Array.isArray(parsed.expenses)
        ? parsed.expenses.filter(
            (e) => e && typeof e.name === 'string' && typeof e.amount === 'number' && Number.isFinite(e.amount),
          )
        : [],
      lapakName: typeof parsed.lapakName === 'string' ? parsed.lapakName : '',
      orderHistory: sanitizeOrders(parsed.orderHistory),
      notes: sanitizeNotes(parsed.notes),
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
  const [notes, setNotes] = useState<{ name: string; price: string; priceNum: number }[]>(draft?.notes ?? [])
  const [total, setTotal] = useState(draft?.total ?? 0)
  const [totalInput, setTotalInput] = useState<string | null>(null)
  const [clickCounts, setClickCounts] = useState<Record<number, number>>({})
  const [visibleBadges, setVisibleBadges] = useState<Set<number>>(new Set())
  const [stock, setStock] = useState<StockItem[]>(draft?.stock ?? defaultStock)
  const [stockInput, setStockInput] = useState<Record<string, string>>({})
  const [stockAlert, setStockAlert] = useState<string | null>(null)
  const [orderHistory, setOrderHistory] = useState<OrderLine[]>(draft?.orderHistory ?? [])
  const [stockAwal, setStockAwal] = useState<StockItem[]>(draft?.stockAwal ?? defaultStock)
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
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const data: DraftState = { total, stock, stockAwal, jumlahKru, expenses, lapakName, orderHistory, notes }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  }, [total, stock, stockAwal, jumlahKru, expenses, lapakName, orderHistory, notes])

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

  const gajiMode: 'flat' | 'persen' = total <= OMSET_FLAT_THRESHOLD ? 'flat' : 'persen'
  const gaji = gajiMode === 'flat' ? FLAT_GAJI_PER_ORANG * jumlahKru : Math.round((total * (PERSEN_GAJI / 100)) / 1000) * 1000
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

  const addOrderLine = (line: OrderLine) => {
    const id = line.item.id
    setOrderHistory((prev) => [...prev, line])
    setNotes((prev) => [...prev, { name: line.item.name, price: line.item.price, priceNum: line.item.priceNum }])
    setTotal((prev) => prev + line.item.priceNum)
    setClickCounts((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }))
    setVisibleBadges((prev) => new Set(prev).add(id))
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
    }
    timersRef.current[id] = setTimeout(() => {
      setVisibleBadges((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setClickCounts((prev) => ({
        ...prev,
        [id]: 0,
      }))
    }, 3000)
  }

  const handleClick = useCallback((item: MenuItem) => {
    if (orderHistory.length === 0) {
      setStockAwal(stock.map((s) => ({ ...s })))
    }
    const updatedStock = deductStock(item.id, stock)
    if (!updatedStock) {
      const recipe = menuRecipes[item.id]
      const missing = recipe
        .filter((r) => {
          const s = stock.find((si) => si.code === r.code)
          return !s || s.quantity < r.amount
        })
        .map((r) => {
          const s = stock.find((si) => si.code === r.code)
          return s ? s.name : r.code
        })
      const msg = `Stok ${missing.join(', ')} tidak cukup untuk ${item.name}!`
      setStockAlert(msg)
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current)
      alertTimerRef.current = setTimeout(() => setStockAlert(null), 3000)
      return
    }

    setStock(updatedStock)
    addOrderLine({ item, deduct: menuRecipes[item.id] })
  }, [stock, orderHistory.length])

  const handlePieceOrder = (item: MenuItem, potong: number) => {
    if (orderHistory.length === 0) {
      setStockAwal(stock.map((s) => ({ ...s })))
    }
    const recipe = menuRecipes[item.id]
    const code = recipe[0].code
    const amount = Math.round(potong * 0.25 * 100) / 100
    const stockItem = stock.find((s) => s.code === code)
    if (!stockItem || stockItem.quantity < amount) {
      const msg = `Stok ${stockItem?.name ?? code} tidak cukup untuk ${potong} potong ${item.name}!`
      setStockAlert(msg)
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current)
      alertTimerRef.current = setTimeout(() => setStockAlert(null), 3000)
      return
    }
    setStock((prev) =>
      prev.map((s) => (s.code === code ? { ...s, quantity: Math.round((s.quantity - amount) * 100) / 100 } : s)),
    )
    const priceNum = potong * 2000
    addOrderLine({
      item: { ...item, name: `${item.name} (${potong} potong)`, price: `${potong * 2}k`, priceNum },
      deduct: [{ code, amount }],
    })
  }

  const handleUndo = () => {
    if (orderHistory.length === 0) return
    const last = orderHistory[orderHistory.length - 1]

    setStock((prev) =>
      prev.map((item) => {
        const ingredient = last.deduct.find((r) => r.code === item.code)
        if (!ingredient) return item
        const newQty = Math.round((item.quantity + ingredient.amount) * 100) / 100
        return { ...item, quantity: newQty }
      }),
    )

    setOrderHistory((prev) => prev.slice(0, -1))
    setNotes((prev) => prev.slice(0, -1))
    setTotal((prev) => prev - last.item.priceNum)
  }

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
      setOrderHistory([])
      setNotes([])
      setClickCounts({})
      setVisibleBadges(new Set())
      setJumlahKru(1)
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
          {stockAlert && (
            <div className="flex-none mx-3 sm:mx-6 mt-3 px-4 py-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg text-center animate-pulse">
              {stockAlert}
            </div>
          )}

          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6">
            {activePage === 'beranda' ? (
              <>
                <div className="md:flex md:gap-4 md:items-start">
                <div className="flex overflow-x-auto snap-x snap-mandatory md:flex-1 md:min-w-0 md:flex-col md:overflow-visible md:snap-none">
                  <div className="w-full flex-none snap-start">
                    <div className="grid grid-cols-2 gap-3 mb-6 justify-center">
                      {menu.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleClick(item)}
                          className="relative flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <div className="relative w-full">
                            {visibleBadges.has(item.id) && (
                              <span className="click-badge absolute top-1 right-1 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-black text-sm font-bold shadow-md">
                                {clickCounts[item.id] || 0}
                              </span>
                            )}
                            <img
                              src={item.image}
                              alt={item.name}
                              onError={(e) => { e.currentTarget.src = '/asset/kebabbiasa.png' }}
                              className="w-full aspect-square object-cover rounded-md"
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{item.name}</span>
                          <span className="text-xs text-gray-500">{item.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="w-full flex-none snap-start">
                    <div className="grid grid-cols-2 gap-3 mb-3 justify-center">
                      {bahanMenu.map((item) => {
                        if (!pieceIds.has(item.id)) {
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleClick(item)}
                              className="relative flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                            >
                              <div className="relative w-full">
                                {visibleBadges.has(item.id) && (
                                  <span className="click-badge absolute top-1 right-1 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-black text-sm font-bold shadow-md">
                                    {clickCounts[item.id] || 0}
                                  </span>
                                )}
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  onError={(e) => { e.currentTarget.src = '/asset/kebabbiasa.png' }}
                                  className="w-full aspect-square object-cover rounded-md"
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{item.name}</span>
                              <span className="text-xs text-gray-500">{item.price}</span>
                            </button>
                          )
                        }
                        return (
                          <div key={item.id} className="relative flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <div className="relative w-full">
                              {visibleBadges.has(item.id) && (
                                <span className="click-badge absolute top-1 right-1 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-black text-sm font-bold shadow-md">
                                  {clickCounts[item.id] || 0}
                                </span>
                              )}
                              <img
                                src={item.image}
                                alt={item.name}
                                onError={(e) => { e.currentTarget.src = '/asset/kebabbiasa.png' }}
                                className="w-full aspect-square object-cover rounded-md"
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{item.name}</span>
                            <div className="grid grid-cols-4 gap-1 w-full">
                              {[4, 3, 2, 1].map((potong) => (
                                <button
                                  key={potong}
                                  onClick={() => handlePieceOrder(item, potong)}
                                  className="flex flex-col items-center py-1 border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer text-sm font-bold leading-tight"
                                >
                                  {potong}
                                  <span className="text-[10px] font-medium">ptg</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3 mt-3 justify-center">
                      {kejuMenu.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleClick(item)}
                          className="relative flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <div className="relative w-full">
                            {visibleBadges.has(item.id) && (
                              <span className="click-badge absolute top-1 right-1 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-black text-sm font-bold shadow-md">
                                {clickCounts[item.id] || 0}
                              </span>
                            )}
                            <img
                              src={item.image}
                              alt={item.name}
                              onError={(e) => { e.currentTarget.src = '/asset/kebabbiasa.png' }}
                              className="w-full aspect-square object-cover rounded-md"
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{item.name}</span>
                          <span className="text-xs text-gray-500">{item.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 md:pt-0 md:w-72 lg:w-80 md:shrink-0 md:sticky md:top-0 md:self-start">
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={handleUndo}
                      disabled={orderHistory.length === 0}
                      className="text-sm px-3 py-1 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200 hover:bg-yellow-100 active:bg-yellow-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Undo
                    </button>
                  </div>
                  <div className="h-52 overflow-y-auto border border-gray-200 rounded-lg p-3 mb-2 bg-white">
                    {notes.length === 0 ? (
                      <p className="text-sm text-gray-400">Klik menu untuk mencatat...</p>
                    ) : (
                      notes.map((note, i) => (
                        <p key={i} className="text-sm text-gray-700 py-1 border-b border-gray-100 last:border-0">
                          {i + 1}. {note.name} - {note.price}
                        </p>
                      ))
                    )}
                  </div>
                  <div className="mt-4 pb-6 text-center">
                    <span className="text-sm text-gray-500">Total Omset</span>
                    <div className="flex items-center justify-center">
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
                        className="w-48 sm:w-64 max-w-full text-3xl font-bold text-gray-900 text-center bg-transparent outline-none"
                      />
                    </div>
                    <div className="mt-1 inline-block bg-green-50 border border-green-200 rounded px-3 py-1">
                      <span className="text-xs text-green-700">Gaji Kru: </span>
                      <span className="text-sm font-bold text-green-600">Rp {gaji.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowClosing(true)}
                    className="hidden md:flex w-full justify-center items-center px-4 py-3 bg-black text-white border border-black hover:bg-gray-800 active:bg-gray-900 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    Selesai Jual
                  </button>
                  </div>
                </div>
              </>
            ) : activePage === 'stok' ? (
              <div className="max-w-xl mx-auto space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">Stok Bahan</h2>
                  <button
                    onClick={() => setShowClosing(true)}
                    className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-md border border-green-200 hover:bg-green-100 active:bg-green-200 transition-colors cursor-pointer"
                  >
                    Closing
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Atur stok sebelum mulai jual. Awal shift tercatat otomatis saat menu pertama diklik.
                </p>
                <div className="space-y-3">
                  {stock.map((item, index) => (
                    <div key={item.code} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div>
                        <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                        <span className="text-xs text-gray-400 ml-2">({item.code})</span>
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={stockInput[item.code] ?? item.quantity}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setStockInput((prev) => ({ ...prev, [item.code]: e.target.value }))}
                        onBlur={() => {
                          const val = stockInput[item.code]
                          const num = val !== undefined ? (parseFloat(val) || 0) : item.quantity
                          setStock((prev) => prev.map((s, i) => (i === index ? { ...s, quantity: num } : s)))
                          setStockInput((prev) => { const next = { ...prev }; delete next[item.code]; return next })
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                        className="w-20 text-center text-sm bg-white border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:border-gray-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto space-y-4">
                <h2 className="text-lg font-bold text-gray-800">Pengeluaran Kru</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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
                <div className="h-52 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
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
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Total Pengeluaran: </span>
                    <span className="text-sm font-bold text-red-600">Rp {totalPengeluaran.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-base font-bold text-gray-800 mb-3">Gaji Kru</h3>
                  {gajiMode === 'flat' && (
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
                    <span className="text-sm text-gray-500">{gajiMode === 'flat' ? 'Gaji Kru (Flat per orang)' : `Gaji Kru (${PERSEN_GAJI}% omset)`}</span>
                    <span className="text-sm font-bold text-green-600">Rp {gaji.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            )}
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
                      <span className="text-black">{gajiMode === 'flat' ? `Gaji Kru (Flat Rp 50.000 × ${jumlahKru})` : `Gaji Kru (${PERSEN_GAJI}% omset)`}</span>
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
