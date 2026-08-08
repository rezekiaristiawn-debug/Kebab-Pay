import { useState } from 'react'
import {
  getSavedPrinter,
  listPrinters,
  savePrinter,
  clearPrinter,
  printTestReceipt,
  friendlyError,
  type SavedPrinter,
} from './lib/printer'

export default function PrinterSettings({ open, onClose, onChanged }: {
  open: boolean
  onClose: () => void
  onChanged?: () => void
}) {
  const [saved, setSaved] = useState<SavedPrinter | null>(() => getSavedPrinter())
  const [scanning, setScanning] = useState(false)
  const [devices, setDevices] = useState<SavedPrinter[]>([])
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!open) return null

  const handleScan = async () => {
    setScanning(true)
    setMessage(null)
    setDevices([])
    try {
      const list = await listPrinters()
      setDevices(list)
      if (list.length === 0) {
        setMessage('Printer tidak ditemukan. Pastikan printer sudah di-pair di Settings > Bluetooth HP (PIN 0000).')
      }
    } catch (e) {
      setMessage(friendlyError(e))
    } finally {
      setScanning(false)
    }
  }

  const handlePick = (p: SavedPrinter) => {
    savePrinter(p)
    setSaved(p)
    setMessage('Printer disimpan: ' + p.name)
    onChanged?.()
  }

  const handleClear = () => {
    clearPrinter()
    setSaved(null)
    setDevices([])
    setMessage('Printer dilepas.')
    onChanged?.()
  }

  const handleTest = async () => {
    if (!saved) return
    setTesting(true)
    setMessage(null)
    try {
      await printTestReceipt(saved)
      setMessage('Tes cetak terkirim. Cek kertas thermal di printer.')
    } catch (e) {
      setMessage(friendlyError(e))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white shadow-md w-full max-w-md max-h-[80vh] overflow-y-auto border border-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Pengaturan Printer</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>

          {saved ? (
            <div className="border border-black p-3 mb-4">
              <p className="text-[10px] font-bold text-black uppercase mb-1">Printer Tersimpan</p>
              <p className="text-sm font-bold text-black truncate">{saved.name}</p>
              <p className="text-xs text-gray-500 truncate">{saved.address}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="flex-1 px-3 py-1.5 bg-black text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {testing ? 'Mencetak...' : 'Tes Cetak'}
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 px-3 py-1.5 bg-white text-black border border-black text-xs font-medium hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Lepas
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-black p-3 mb-4">
              <p className="text-xs text-gray-600">Belum ada printer tersimpan. Cari printer di bawah lalu pilih.</p>
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={scanning}
            className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-semibold shadow-sm hover:bg-gray-800 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {scanning ? 'Mencari...' : saved ? 'Ganti / Cari Printer Lain' : 'Cari Printer Bluetooth'}
          </button>

          <p className="text-[10px] text-gray-400 mt-2 mb-2">
            Pair dulu printer di Settings &gt; Bluetooth HP (PIN 0000) sebelum mencari.
          </p>

          {devices.length > 0 && (
            <div className="border border-gray-200 divide-y divide-gray-100">
              {devices.map((d) => (
                <button
                  key={d.address}
                  onClick={() => handlePick(d)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{d.name}</p>
                    <p className="text-xs text-gray-400 truncate">{d.address}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">Pilih</span>
                </button>
              ))}
            </div>
          )}

          {message && <p className="mt-3 text-xs text-gray-600">{message}</p>}
        </div>
      </div>
    </div>
  )
}
