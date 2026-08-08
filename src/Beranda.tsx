import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { listLapak, lapakLabel, type Lapak } from './lib/lapak'
import StokNotice from './StokNotice'

interface StockItem {
  code: string
  name: string
  quantity: number
}

const defaultStock: StockItem[] = [
  { code: 'K', name: 'Kulit', quantity: 0 },
  { code: 'R', name: 'Roti', quantity: 0 },
  { code: 'T', name: 'Telor', quantity: 0 },
  { code: 'S', name: 'Sosis', quantity: 0 },
  { code: 'DS', name: 'Daging Sapi', quantity: 0 },
  { code: 'DA', name: 'Daging Ayam', quantity: 0 },
]

const itemPrices: Record<string, number> = {
  K: 3000,
  R: 4000,
  T: 3000,
  S: 8000,
  DS: 8000,
  DA: 8000,
}

const OMSET_FLAT_THRESHOLD = 500000
const FLAT_GAJI_PER_ORANG = 50000
const PERSEN_GAJI = 10

export default function Beranda() {
  const [omset, setOmset] = useState(0)
  const [omsetInput, setOmsetInput] = useState<string | null>(null)
  const [stock, setStock] = useState<StockItem[]>(defaultStock)
  const [stockInput, setStockInput] = useState<Record<string, string>>({})
  const [stockAwal, setStockAwal] = useState<StockItem[]>(defaultStock)
  const [stockAwalInput, setStockAwalInput] = useState<Record<string, string>>({})
  const [showClosing, setShowClosing] = useState(false)
  const [lapakName, setLapakName] = useState('')
  const [lapaks, setLapaks] = useState<Lapak[]>([])
  const [lapakFallback, setLapakFallback] = useState(false)
  const [sending, setSending] = useState(false)
  const [expenses, setExpenses] = useState<{ name: string; amount: number }[]>([])
  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseFocus, setExpenseFocus] = useState(false)
  const [jumlahKru, setJumlahKru] = useState(1)
  const [kruInput, setKruInput] = useState<string | null>(null)

  useEffect(() => {
    listLapak().then((list) => {
      if (list) setLapaks(list)
      else setLapakFallback(true)
    })
  }, [])

  const gajiMode: 'flat' | 'persen' = omset <= OMSET_FLAT_THRESHOLD ? 'flat' : 'persen'
  const gaji = gajiMode === 'flat' ? FLAT_GAJI_PER_ORANG * jumlahKru : Math.round((omset * (PERSEN_GAJI / 100)) / 1000) * 1000
  const totalPengeluaran = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalTerjual = stockAwal.reduce((sum, awal, i) => {
    const sisa = stock[i]?.quantity ?? 0
    return sum + Math.max(0, Math.round(awal.quantity) - Math.round(sisa))
  }, 0)
  const omsetBersih = omset - gaji - totalPengeluaran

  const nilaiStok = stock.map((item, i) => {
    const awal = stockAwal[i]?.quantity ?? 0
    const terjual = Math.max(0, awal - item.quantity)
    const harga = itemPrices[item.code] ?? 0
    return { code: item.code, name: item.name, terjual, harga, nilai: terjual * harga }
  })
  const totalNilaiStok = nilaiStok.reduce((s, r) => s + r.nilai, 0)

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
      omset_kotor: omset,
      gaji_kru: gaji,
      pengeluaran: expenses,
      total_pengeluaran: totalPengeluaran,
      omset_bersih: omsetBersih,
      item_terjual: totalTerjual,
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
      setOmset(0)
      setOmsetInput(null)
      setStock(defaultStock)
      setStockInput({})
      setStockAwal(defaultStock)
      setStockAwalInput({})
      setExpenses([])
      setExpenseName('')
      setExpenseAmount('')
      setJumlahKru(1)
      setKruInput(null)
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
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <section className="bg-white shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Omset Harian</h2>
                <button
                  onClick={() => setShowClosing(true)}
                  className="text-sm px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 active:bg-green-800 transition-colors cursor-pointer"
                >
                  Closing
                </button>
              </div>
              <div className="flex items-center justify-center py-2">
                <span className="text-2xl font-bold text-gray-900">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={omsetInput !== null ? omsetInput : omset > 0 ? omset.toLocaleString('id-ID') : ''}
                  onFocus={(e) => { if (omset > 0) setOmsetInput(String(Math.round(omset / 1000))); e.target.select() }}
                  onChange={(e) => setOmsetInput(e.target.value.replace(/[^\d]/g, ''))}
                  onBlur={() => { if (omsetInput !== null) setOmset((parseInt(omsetInput) || 0) * 1000); setOmsetInput(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                  placeholder="0"
                  className="w-48 sm:w-64 max-w-full text-3xl font-bold text-gray-900 text-center bg-transparent outline-none"
                />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">Gaji Kru</span>
                </div>
                {gajiMode === 'flat' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
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
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-600">{PERSEN_GAJI}% dari omset</span>
                      <span className="text-sm font-bold text-green-600">Rp {gaji.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-3">Stok Bahan</h2>
              <div className="flex items-center gap-3 mb-1 text-xs text-gray-400">
                <div className="flex-1 min-w-0" />
                <span className="w-16 text-center">Awal</span>
                <span className="w-16 text-center">Sisa</span>
                <span className="w-16 text-center">Terjual</span>
              </div>
              <div className="space-y-3">
                {stock.map((item, index) => {
                  const awal = stockAwal[index] ?? item
                  const terjual = Math.max(0, awal.quantity - item.quantity)
                  return (
                    <div key={item.code} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0 truncate">
                        <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                        <span className="text-xs text-gray-400 ml-2">({item.code})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={stockAwalInput[item.code] ?? awal.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setStockAwalInput((prev) => ({ ...prev, [item.code]: e.target.value }))}
                          onBlur={() => {
                            const val = stockAwalInput[item.code]
                            const num = val !== undefined ? (parseFloat(val) || 0) : awal.quantity
                            setStockAwal((prev) => prev.map((s, i) => (i === index ? { ...s, quantity: num } : s)))
                            setStockAwalInput((prev) => { const next = { ...prev }; delete next[item.code]; return next })
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                          placeholder="0"
                          className="w-16 text-center text-sm bg-white border border-gray-300 px-2 py-1 focus:outline-none focus:border-gray-400"
                        />
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
                          placeholder="0"
                          className="w-16 text-center text-sm bg-white border border-gray-300 px-2 py-1 focus:outline-none focus:border-gray-400"
                        />
                        <span className="w-16 text-center text-sm font-bold text-blue-600">{terjual}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-1">Nilai Stok Terjual</h2>
              <p className="text-xs text-gray-400 mb-3">Estimasi dari terjual × harga item (Sosis/Daging 1 potong = Rp 2.000)</p>
              <div className="space-y-1.5">
                {nilaiStok.map((row) => (
                  <div key={row.code} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 truncate">
                      <span className="text-sm font-semibold text-gray-700">{row.name}</span>
                      <span className="block text-xs text-gray-400 truncate">{row.terjual.toLocaleString('id-ID')} × Rp {row.harga.toLocaleString('id-ID')}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">Rp {row.nilai.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-2 mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">Total</span>
                <span className="text-base font-bold text-green-600">Rp {totalNilaiStok.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-3">Pengeluaran Kru</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                <input
                  type="text"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  placeholder="Nama pengeluaran"
                  className="w-full sm:flex-1 min-w-0 text-sm border border-gray-300 px-3 py-2 focus:outline-none focus:border-gray-400"
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
                    className="w-32 shrink-0 text-sm border border-gray-300 px-3 py-2 focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>
              <div className="h-44 overflow-y-auto border border-gray-100 p-3 mb-3">
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
              <div className="mt-3 bg-gray-50 p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-500">{gajiMode === 'flat' ? 'Gaji Kru (Flat per orang)' : `Gaji Kru (${PERSEN_GAJI}% omset)`}</span>
                  <span className="text-sm font-bold text-green-600">Rp {gaji.toLocaleString('id-ID')}</span>
                </div>
                {expenses.length > 0 && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-500">Total Pengeluaran</span>
                      <span className="text-sm font-bold text-red-600">Rp {totalPengeluaran.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-1.5 flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-500">Gaji + Pengeluaran</span>
                      <span className="text-sm font-bold text-red-600">Rp {(gaji + totalPengeluaran).toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
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
                    placeholder="Contoh: 1 Gatsu"
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
                      return (
                        <tr key={awal.code} className="border-t border-black">
                          <td className="px-3 py-2 text-black">{awal.name}</td>
                          <td className="px-3 py-2 text-right text-black">{awal.quantity}</td>
                          <td className="px-3 py-2 text-right text-black">{sisa}</td>
                          <td className="px-3 py-2 text-right font-bold text-blue-600">{terjual}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border border-black p-3 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-black">Omset Kotor</span>
                  <span className="font-bold text-black">Rp {omset.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-black">{gajiMode === 'flat' ? `Gaji Kru (Flat Rp 50.000 × ${jumlahKru})` : `Gaji Kru (${PERSEN_GAJI}% omset)`}</span>
                  <span className="font-bold text-black">Rp {gaji.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-black">Item Terjual</span>
                  <span className="font-bold text-blue-600">{totalTerjual}</span>
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
