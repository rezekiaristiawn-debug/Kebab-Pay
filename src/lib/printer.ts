import { Capacitor } from '@capacitor/core'
import { EscPosPrinter, BluetoothPrinter, PrinterError } from '@fedejm/capacitor-esc-pos-printer'

export interface ClosingReport {
  id: number
  nama_lapak: string
  tanggal: string
  omset_kotor: number
  gaji_kru: number
  pengeluaran: { name: string; amount: number }[]
  total_pengeluaran: number
  omset_bersih: number
  item_terjual: number
  stok?: { name: string; awal: number; sisa: number; terjual: number; harga?: number }[]
  created_at: string
}

const STOK_HARGA_BY_NAME: Record<string, number> = {
  Kulit: 3000,
  Roti: 4000,
  Telor: 4000,
  Sosis: 8000,
  'Daging Sapi': 8000,
  'Daging Ayam': 8000,
}

export function stokHarga(s: { name: string; harga?: number }): number {
  return s.harga ?? STOK_HARGA_BY_NAME[s.name] ?? 0
}

export interface SavedPrinter {
  name: string
  address: string
  paperWidth?: 58 | 80
}

const STORE_KEY = 'kebab_printer'

export function getSavedPrinter(): SavedPrinter | null {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as SavedPrinter) : null
  } catch {
    return null
  }
}

export function savePrinter(printer: SavedPrinter) {
  localStorage.setItem(STORE_KEY, JSON.stringify(printer))
}

export function clearPrinter() {
  localStorage.removeItem(STORE_KEY)
}

export function printerAvailable(): boolean {
  return Capacitor.isNativePlatform()
}

export async function listPrinters(): Promise<SavedPrinter[]> {
  if (!printerAvailable()) throw new Error('Fitur ini hanya tersedia di aplikasi Android.')
  const { value } = await EscPosPrinter.requestBluetoothEnable()
  if (!value) throw new Error('Bluetooth tidak aktif.')
  const { devices } = await EscPosPrinter.getBluetoothPrinterDevices()
  return devices.map((d) => ({ name: d.name || d.address, address: d.address }))
}

export function friendlyError(e: unknown): string {
  if (e instanceof PrinterError) {
    switch (e.errorCode) {
      case 1:
        return 'Gagal terhubung ke printer. Pastikan printer hidup dan dekat dengan HP.'
      case 2:
        return 'Printer belum terhubung.'
      case 3:
        return 'Gagal mengirim data ke printer.'
      case 5:
        return 'Izin Bluetooth ditolak. Izinkan lewat Settings > Apps di HP.'
      case 6:
        return 'Printer tidak ditemukan. Pair dulu lewat Settings Bluetooth di HP.'
    }
  }
  return e instanceof Error ? e.message : 'Gagal mencetak.'
}

const ESC = 0x1b
const GS = 0x1d

const PAPER_WIDTH: Record<58 | 80, number> = { 58: 32, 80: 48 }

function receiptWidth(p: SavedPrinter): number {
  return PAPER_WIDTH[p.paperWidth ?? 58]
}

const pad = (s: string, w: number) => s.padEnd(w).slice(0, w)
const money = (n: number) => 'Rp ' + n.toLocaleString('id-ID')
const center = (s: string, w: number) => s.padStart(Math.floor((w - s.length) / 2) + s.length).padEnd(w)
const kv = (label: string, value: string, w: number) => pad(label, Math.floor(w / 2)) + value.padStart(Math.ceil(w / 2))

function encode(text: string): number[] {
  const out: number[] = []
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    out.push(c <= 0xff ? c : 0x3f)
  }
  return out
}

function buildReceipt(r: ClosingReport, width: number): number[] {
  const out: number[] = []
  const push = (arr: number[]) => out.push(...arr)
  const line = (s: string) => push(encode(s + '\n'))
  const boldLine = (s: string) => {
    push([ESC, 0x45, 1])
    push(encode(s + '\n'))
    push([ESC, 0x45, 0])
  }
  const alignLeft = () => push([ESC, 0x61, 0])
  const alignCenter = () => push([ESC, 0x61, 1])

  const d = new Date(r.tanggal)
  const dateStr = d.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  push([ESC, 0x40])
  push([ESC, 0x74, 0])
  push([ESC, 0x64, 2])

  alignCenter()
  boldLine('LAPORAN HARIAN')
  line(center(dateStr, width))
  boldLine(center('Lapak: ' + r.nama_lapak, width))
  alignLeft()

  if (r.stok && r.stok.some((s) => s.terjual > 0)) {
    line('-'.repeat(width))
    alignCenter()
    boldLine('STOK')
    alignLeft()
    const numW = Math.max(5, Math.floor(width / 5))
    const lastW = numW + 1
    const nameW = width - numW * 2 - lastW
    line(pad('Nama', nameW) + 'Awal'.padStart(numW) + 'Sisa'.padStart(numW) + 'Terjual'.padStart(lastW))
    for (const s of r.stok) {
      if (s.terjual <= 0) continue
      line(pad(s.name, nameW) + String(s.awal).padStart(numW) + String(s.sisa).padStart(numW) + String(s.terjual).padStart(lastW))
    }
    line('-'.repeat(width))
    alignCenter()
    boldLine('NILAI STOK TERJUAL')
    alignLeft()
    let totalNilai = 0
    for (const s of r.stok) {
      const harga = stokHarga(s)
      const nilai = s.terjual * harga
      if (nilai <= 0) continue
      totalNilai += nilai
      line(kv(s.name, money(nilai), width))
      line('   ' + String(s.terjual) + ' x ' + money(harga))
    }
    boldLine(kv('Total', money(totalNilai), width))
    line('-'.repeat(width))
  }

  line('-'.repeat(width))
  line(kv('Omset Kotor', money(r.omset_kotor), width))
  line(kv('Gaji Kru', money(r.gaji_kru), width))
  line(kv('Item Terjual', String(r.item_terjual), width))

  if (r.pengeluaran && r.pengeluaran.length > 0) {
    line('-'.repeat(width))
    alignCenter()
    boldLine('PENGELUARAN')
    alignLeft()
    for (const e of r.pengeluaran) {
      line(kv(e.name, money(e.amount), width))
    }
    line('-'.repeat(width))
    line(kv('Total Pengeluaran', money(r.total_pengeluaran), width))
    line(kv('Gaji + Pengeluaran', money(r.gaji_kru + r.total_pengeluaran), width))
  }

  line('='.repeat(width))
  boldLine(kv('OMSET BERSIH', money(r.omset_bersih), width))
  line('='.repeat(width))

  alignCenter()
  line('Kebab Gatsu App')

  push([ESC, 0x64, 4])
  push([GS, 0x56, 0x42, 0])
  return out
}

function testReceiptBytes(width: number): number[] {
  const out: number[] = []
  const push = (arr: number[]) => out.push(...arr)
  const line = (s: string) => push(encode(s + '\n'))
  const boldLine = (s: string) => {
    push([ESC, 0x45, 1])
    push(encode(s + '\n'))
    push([ESC, 0x45, 0])
  }
  const alignLeft = () => push([ESC, 0x61, 0])
  const alignCenter = () => push([ESC, 0x61, 1])

  push([ESC, 0x40])
  push([ESC, 0x74, 0])
  push([ESC, 0x64, 1])

  alignCenter()
  boldLine(center('Kebab Gatsu App', width))
  line(center('Tes Cetak Printer', width))
  alignLeft()
  line('-'.repeat(width))
  line(kv('Status', 'OK', width))
  line(kv('Lebar Cetak', width + ' kolom', width))
  line(kv('Waktu', new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), width))
  line('-'.repeat(width))
  alignCenter()
  line('Struk berhasil dicetak')

  push([ESC, 0x64, 3])
  push([GS, 0x56, 0x42, 0])
  return out
}

async function sendBytes(printer: SavedPrinter, data: number[]): Promise<void> {
  if (!printerAvailable()) throw new Error('Fitur ini hanya tersedia di aplikasi Android.')
  const { value } = await EscPosPrinter.requestBluetoothEnable()
  if (!value) throw new Error('Bluetooth tidak aktif.')

  const p = new BluetoothPrinter(printer.address)
  try {
    await p.link()
    await p.connect()
    await p.send(data)
  } catch (e) {
    throw new Error(friendlyError(e))
  } finally {
    try {
      await p.disconnect()
    } catch {
      // abaikan
    }
    try {
      await p.dispose()
    } catch {
      // abaikan
    }
  }
}

export async function printReceipt(report: ClosingReport, printer: SavedPrinter): Promise<void> {
  await sendBytes(printer, buildReceipt(report, receiptWidth(printer)))
}

export async function printTestReceipt(printer: SavedPrinter): Promise<void> {
  await sendBytes(printer, testReceiptBytes(receiptWidth(printer)))
}
