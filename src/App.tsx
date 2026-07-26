import { useState, useRef, useCallback } from 'react'

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

const defaultStock: StockItem[] = [
  { code: 'K', name: 'Kulit', quantity: 200 },
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
  { id: 5, name: 'Full Ayam', price: '11k', priceNum: 11000, image: '/asset/kebabayam.png' },
  { id: 6, name: 'Sosis Jumbo', price: '11k', priceNum: 11000, image: '/asset/kebabsosis.png' },
  { id: 7, name: 'Komplit', price: '11k', priceNum: 11000, image: '/asset/kebabkomplit.png' },
]

const menuRecipes: Record<number, RecipeIngredient[]> = {
  1: [{ code: 'S', amount: 0.25 }, { code: 'K', amount: 1 }],
  2: [{ code: 'T', amount: 1 }, { code: 'K', amount: 1 }],
  3: [{ code: 'DS', amount: 0.5 }, { code: 'K', amount: 1 }],
  4: [{ code: 'DS', amount: 1 }, { code: 'K', amount: 1 }],
  5: [{ code: 'DA', amount: 1 }, { code: 'K', amount: 1 }],
  6: [{ code: 'S', amount: 1 }, { code: 'K', amount: 1 }],
  7: [{ code: 'S', amount: 0.25 }, { code: 'DS', amount: 0.25 }, { code: 'T', amount: 1 }, { code: 'K', amount: 1 }],
}

function canFulfillOrder(menuId: number, stock: StockItem[]): boolean {
  const recipe = menuRecipes[menuId]
  if (!recipe) return false
  return recipe.every((ingredient) => {
    const stockItem = stock.find((s) => s.code === ingredient.code)
    return stockItem && stockItem.quantity >= ingredient.amount
  })
}

function deductStock(
  menuId: number,
  stock: StockItem[],
): StockItem[] | null {
  if (!canFulfillOrder(menuId, stock)) return null
  const recipe = menuRecipes[menuId]
  return stock.map((item) => {
    const ingredient = recipe.find((r) => r.code === item.code)
    if (!ingredient) return item
    const newQty = Math.round((item.quantity - ingredient.amount) * 100) / 100
    return { ...item, quantity: newQty }
  })
}

type Tab = 'home' | 'stok' | 'catatan'

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.97-.97V19.5a2.25 2.25 0 0 1-2.25 2.25H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H6.56A2.25 2.25 0 0 1 4.31 19.5v-6.87l-.97.97a.75.75 0 0 1-1.06-1.06l8.69-8.69Z" />
    </svg>
  )
}

function StockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375ZM19.5 9.75c0-1.036-.84-1.875-1.875-1.875H6.375c-1.036 0-1.875.84-1.875 1.875v.75c0 1.035.84 1.875 1.875 1.875h11.25c1.035 0 1.875-.84 1.875-1.875v-.75ZM3.75 15c0-1.036-.84-1.875-1.875-1.875S0 13.964 0 15v.75c0 1.036.84 1.875 1.875 1.875S3.75 16.786 3.75 15.75v-.75Z" />
    </svg>
  )
}

function NotesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M7.5 6a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 6ZM7.5 12a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 12Zm.75 5.25a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M3 5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v13.5A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V5.25ZM5.25 4.5A.75.75 0 0 0 4.5 5.25v13.5c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75V5.25a.75.75 0 0 0-.75-.75H5.25Z" clipRule="evenodd" />
    </svg>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [notes, setNotes] = useState<{ name: string; price: string; priceNum: number }[]>([])
  const [total, setTotal] = useState(0)
  const [clickCounts, setClickCounts] = useState<Record<number, number>>({})
  const [visibleBadges, setVisibleBadges] = useState<Set<number>>(new Set())
  const [stock, setStock] = useState<StockItem[]>(defaultStock)
  const [stockInput, setStockInput] = useState<Record<string, string>>({})
  const [stockAlert, setStockAlert] = useState<string | null>(null)
  const [orderHistory, setOrderHistory] = useState<MenuItem[]>([])
  const [totalInput, setTotalInput] = useState<string | null>(null)
  const [stockAwal, setStockAwal] = useState<StockItem[]>(defaultStock)
  const [showClosing, setShowClosing] = useState(false)
  const [lapakName, setLapakName] = useState('')
  const [sending, setSending] = useState(false)
  const [expenses, setExpenses] = useState<{ name: string; amount: number }[]>([])
  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    setOrderHistory((prev) => [...prev, item])

    setClickCounts((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }))

    setVisibleBadges((prev) => new Set(prev).add(item.id))

    if (timersRef.current[item.id]) {
      clearTimeout(timersRef.current[item.id])
    }
    timersRef.current[item.id] = setTimeout(() => {
      setVisibleBadges((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
      setClickCounts((prev) => ({
        ...prev,
        [item.id]: 0,
      }))
    }, 3000)

    setNotes((prev) => [...prev, { name: item.name, price: item.price, priceNum: item.priceNum }])
    setTotal((prev) => prev + item.priceNum)
  }, [stock, orderHistory.length])

  const handleUndo = () => {
    if (orderHistory.length === 0) return
    const lastItem = orderHistory[orderHistory.length - 1]
    const recipe = menuRecipes[lastItem.id]

    setStock((prev) =>
      prev.map((item) => {
        const ingredient = recipe.find((r) => r.code === item.code)
        if (!ingredient) return item
        const newQty = Math.round((item.quantity + ingredient.amount) * 100) / 100
        return { ...item, quantity: newQty }
      }),
    )

    setOrderHistory((prev) => prev.slice(0, -1))
    setNotes((prev) => prev.slice(0, -1))
    setTotal((prev) => prev - lastItem.priceNum)
  }

  const handleKirim = async () => {
    if (!lapakName.trim()) return
    setSending(true)
    const gaji = Math.floor(total * 0.1)
    const totalPengeluaran = expenses.reduce((sum, e) => sum + e.amount, 0)
    const payload = {
      nama_lapak: lapakName.trim(),
      tanggal: new Date().toISOString(),
      omset_kotor: total,
      gaji_kru: gaji,
      pengeluaran: expenses,
      total_pengeluaran: totalPengeluaran,
      omset_bersih: total - gaji - totalPengeluaran,
      item_terjual: notes.length,
      sisa_stock: stock,
    }
    try {
      // TODO: ganti ke endpoint backend yang sesungguhnya
      console.log('Payload closing:', payload)
      await new Promise((r) => setTimeout(r, 1000))
      alert(`Data "${lapakName}" berhasil dikirim!`)
      setShowClosing(false)
    } catch {
      alert('Gagal mengirim data, coba lagi.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="flex-none px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/asset/logokebabgatsu.png" alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          <h1 className="text-base sm:text-xl font-bold text-gray-800">
            Kebab Gatsu
          </h1>
        </div>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'home' ? 'text-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <HomeIcon />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('stok')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'stok' ? 'text-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <StockIcon />
            <span className="hidden sm:inline">Stok</span>
          </button>
          <button
            onClick={() => setActiveTab('catatan')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'catatan' ? 'text-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <NotesIcon />
            <span className="hidden sm:inline">Catatan</span>
          </button>
        </nav>
      </header>

      {stockAlert && (
        <div className="flex-none mx-6 mt-3 px-4 py-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg text-center animate-pulse">
          {stockAlert}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        {activeTab === 'home' ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6 justify-center">
              {menu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  className="relative flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
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
                      className="w-full aspect-square object-cover rounded-md"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-xs text-gray-500">{item.price}</span>
                </button>
              ))}
            </div>

            <div className="pt-4">
                <div className="flex justify-end mb-3">
                  <button
                    onClick={handleUndo}
                    disabled={orderHistory.length === 0}
                    className="text-sm px-3 py-1 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200 hover:bg-yellow-100 active:bg-yellow-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Undo
                  </button>
                </div>
              <div className="h-52 overflow-y-auto border border-gray-200 rounded-lg p-3 mb-2">
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
                    value={totalInput !== null ? totalInput : total.toLocaleString('id-ID')}
                    onFocus={() => setTotalInput(String(total / 1000))}
                    onChange={(e) => setTotalInput(e.target.value)}
                    onBlur={() => { setTotal((parseInt(totalInput?.replace(/\./g, '') ?? '0') || 0) * 1000); setTotalInput(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                    className="w-24 text-lg font-bold text-gray-800 text-center bg-transparent outline-none"
                  />
                </div>
                <div className="mt-1 inline-block bg-green-50 border border-green-200 rounded px-3 py-1">
                  <span className="text-xs text-green-700">Gaji Kru: </span>
                  <span className="text-sm font-bold text-green-600">Rp {Math.floor(total * 0.1).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'stok' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Stok Bahan</h2>
              <button
                onClick={() => setShowClosing(true)}
                disabled={notes.length === 0}
                className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded-md border border-green-200 hover:bg-green-100 active:bg-green-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Closing
              </button>
            </div>
            <div className="space-y-3">
              {stock.map((item, index) => (
                <div key={item.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                    <span className="text-xs text-gray-400 ml-2">({item.code})</span>
                  </div>
                  <input
                    type="number"
                    value={stockInput[item.code] ?? item.quantity}
                    onChange={(e) => setStockInput((prev) => ({ ...prev, [item.code]: e.target.value }))}
                    onBlur={() => {
                      const val = stockInput[item.code]
                      const num = val !== undefined ? (parseInt(val) || 0) : item.quantity
                      setStock((prev) => prev.map((s, i) => (i === index ? { ...s, quantity: num } : s)))
                      setStockInput((prev) => { const next = { ...prev }; delete next[item.code]; return next })
                    }}
                    className="w-20 text-center text-sm bg-white border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:border-orange-400"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Pengeluaran Kru</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="Nama pengeluaran"
                className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-orange-400"
              />
              <input
                type="text"
                inputMode="numeric"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                onFocus={() => {
                  const num = parseInt(expenseAmount.replace(/\./g, '')) || 0
                  setExpenseAmount(num > 0 ? String(num / 1000) : '')
                }}
                onBlur={() => {
                  const num = parseInt(expenseAmount.replace(/\./g, '')) || 0
                  if (num > 0) {
                    setExpenseAmount((num * 1000).toLocaleString('id-ID'))
                  }
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                placeholder="Harga"
                className="w-28 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-orange-400"
              />
            </div>
            <div className="h-52 overflow-y-auto border border-gray-200 rounded-lg p-3">
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
                        className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => {
                if (!expenseName.trim() || !expenseAmount.trim()) return
                const num = parseInt(expenseAmount.replace(/\./g, '')) || 0
                if (num <= 0) return
                setExpenses((prev) => [...prev, { name: expenseName.trim(), amount: num }])
                setExpenseName('')
                setExpenseAmount('')
              }}
              className="w-full px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 active:bg-orange-700 transition-colors cursor-pointer"
            >
              Tambah
            </button>
            {expenses.length > 0 && (
              <div className="text-right">
                <span className="text-sm text-gray-500">Total Pengeluaran: </span>
                <span className="text-sm font-bold text-red-600">Rp {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('id-ID')}</span>
              </div>
            )}
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

              <div className="mb-4">
                <label className="text-xs font-bold text-black block mb-1">Nama Lapak</label>
                <input
                  type="text"
                  value={lapakName}
                  onChange={(e) => setLapakName(e.target.value)}
                  placeholder="Contoh: Lapak 01"
                  className="w-full border border-black px-2 py-1.5 text-sm text-black placeholder-gray-400 focus:outline-none"
                />
              </div>

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
                    {stockAwal.map((awal) => {
                      const sisa = stock.find((s) => s.code === awal.code)
                      const terjual = awal.quantity - (sisa?.quantity ?? 0)
                      return (
                        <tr key={awal.code} className="border-t border-black">
                          <td className="px-3 py-2 text-black">{awal.name}</td>
                          <td className="px-3 py-2 text-right text-black">{awal.quantity}</td>
                          <td className="px-3 py-2 text-right text-black">{sisa?.quantity ?? 0}</td>
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
                  <span className="text-black">Gaji Kru (10%)</span>
                  <span className="font-bold text-black">Rp {Math.floor(total * 0.1).toLocaleString('id-ID')}</span>
                </div>
                {expenses.length > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-black">Total Pengeluaran</span>
                    <span className="font-bold text-black">Rp {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="border-t border-black pt-2 mt-1 flex justify-between text-sm">
                  <span className="text-black font-bold">Omset Bersih</span>
                  <span className="font-bold text-black">Rp {(total - Math.floor(total * 0.1) - expenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString('id-ID')}</span>
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
  )
}
