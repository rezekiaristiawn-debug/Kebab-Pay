import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

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

function Receipt({ report, onPrint }: { report: ClosingReport; onPrint: () => void }) {
  const dateStr = new Date(report.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="print-receipt bg-white w-56 mx-auto border-2 border-dashed border-gray-400 p-3 text-xs leading-snug">
      <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
        <p className="text-sm font-bold tracking-wider text-gray-900">LAPORAN HARIAN</p>
      </div>
      <div className="mb-2 text-gray-700 space-y-0.5">
        <div className="flex">
          <span className="w-14 text-gray-500">Lapak</span>
          <span className="font-semibold">: {report.nama_lapak}</span>
        </div>
        <div className="flex">
          <span className="w-14 text-gray-500">Tanggal</span>
          <span className="truncate">: {dateStr}</span>
        </div>
      </div>
      <div className="border-t border-dashed border-gray-400 pt-1.5 mb-1.5 space-y-0.5">
        <div className="flex justify-between">
          <span className="text-gray-600">Omset Kotor</span>
          <span className="font-semibold text-gray-900">Rp {report.omset_kotor.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Gaji Kru (10%)</span>
          <span className="font-semibold text-gray-900">Rp {report.gaji_kru.toLocaleString('id-ID')}</span>
        </div>
        {report.pengeluaran.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-dashed border-gray-300">
            <p className="font-semibold text-gray-700 mb-0.5">Pengeluaran</p>
            {report.pengeluaran.map((e, i) => (
              <div key={i} className="flex justify-between ml-2 text-gray-600">
                <span>{e.name}</span>
                <span>Rp {e.amount.toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-gray-800 border-t border-dashed border-gray-300 mt-0.5 pt-0.5">
              <span>Total</span>
              <span>Rp {report.total_pengeluaran.toLocaleString('id-ID')}</span>
            </div>
          </div>
        )}
      </div>
      <div className="border-t-2 border-dashed border-gray-400 pt-1.5 mt-1.5">
        <div className="flex justify-between text-sm">
          <span className="font-bold text-gray-900">OMSET BERSIH</span>
          <span className="font-bold text-gray-900">Rp {report.omset_bersih.toLocaleString('id-ID')}</span>
        </div>
      </div>
      <div className="text-center text-gray-400 text-[8px] mt-2 pt-1.5 border-t border-dashed border-gray-300">
        Kebab Gatsu App
      </div>
      <div className="no-print text-right mt-1.5">
        <button
          onClick={onPrint}
          className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-medium rounded hover:bg-gray-800 active:bg-gray-700 transition-colors cursor-pointer"
        >
          Print
        </button>
      </div>
    </div>
  )
}

export default function Laporan() {
  const [reports, setReports] = useState<ClosingReport[]>([])
  const [loading, setLoading] = useState(true)
  const [printReport, setPrintReport] = useState<ClosingReport | null>(null)
  const [printAll, setPrintAll] = useState(false)

  useEffect(() => {
    supabase
      .from('closing_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          alert('Gagal load data: ' + error.message)
        } else if (data) {
          setReports(data as ClosingReport[])
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!printAll) return
    document.body.classList.add('print-all-active')
    const timer = setTimeout(() => window.print(), 100)
    const handleAfterPrint = () => {
      document.body.classList.remove('print-all-active')
      setPrintAll(false)
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('afterprint', handleAfterPrint)
      document.body.classList.remove('print-all-active')
    }
  }, [printAll])

  if (printAll) {
    return (
      <div className="p-8">
        {reports.map((r) => (
          <ReceiptSimple key={r.id} report={r} />
        ))}
      </div>
    )
  }

  if (printReport) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
        <div className="no-print mb-3">
          <button
            onClick={() => setPrintReport(null)}
            className="text-sm px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer"
          >
            Kembali
          </button>
        </div>
        <Receipt report={printReport} onPrint={() => window.print()} />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900">Laporan dari Kru</h1>
          <div className="flex items-center gap-2">
            {reports.length > 0 && (
              <button
                onClick={() => setPrintAll(true)}
                className="no-print px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 active:bg-gray-700 transition-colors cursor-pointer"
              >
                Print Semua
              </button>
            )}
            <p className="text-sm text-gray-400">{reports.length} laporan</p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500">Belum ada laporan masuk.</p>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {reports.map((r) => (
              <div key={r.id} className="flex-none">
                <Receipt report={r} onPrint={() => setPrintReport(r)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReceiptSimple({ report }: { report: ClosingReport }) {
  const dateStr = new Date(report.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="print-all-receipt border-2 border-dashed border-gray-400 p-4 text-sm leading-snug mb-4">
      <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
        <p className="text-base font-bold tracking-wider">LAPORAN HARIAN</p>
      </div>
      <div className="mb-2 space-y-0.5">
        <div className="flex">
          <span className="w-16 text-gray-500">Lapak</span>
          <span className="font-semibold">: {report.nama_lapak}</span>
        </div>
        <div className="flex">
          <span className="w-16 text-gray-500">Tanggal</span>
          <span>: {dateStr}</span>
        </div>
      </div>
      <div className="border-t border-dashed border-gray-400 pt-1.5 mb-1.5 space-y-0.5">
        <div className="flex justify-between">
          <span className="text-gray-600">Omset Kotor</span>
          <span className="font-semibold">Rp {report.omset_kotor.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Gaji Kru (10%)</span>
          <span className="font-semibold">Rp {report.gaji_kru.toLocaleString('id-ID')}</span>
        </div>
        {report.pengeluaran.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-dashed border-gray-300">
            <p className="font-semibold text-gray-700 mb-0.5">Pengeluaran</p>
            {report.pengeluaran.map((e, i) => (
              <div key={i} className="flex justify-between ml-2 text-gray-600">
                <span>{e.name}</span>
                <span>Rp {e.amount.toLocaleString('id-ID')}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold border-t border-dashed border-gray-300 mt-0.5 pt-0.5">
              <span>Total</span>
              <span>Rp {report.total_pengeluaran.toLocaleString('id-ID')}</span>
            </div>
          </div>
        )}
      </div>
      <div className="border-t-2 border-dashed border-gray-400 pt-1.5 mt-1.5">
        <div className="flex justify-between text-base">
          <span className="font-bold">OMSET BERSIH</span>
          <span className="font-bold">Rp {report.omset_bersih.toLocaleString('id-ID')}</span>
        </div>
      </div>
      <div className="text-center text-gray-400 text-[8px] mt-2 pt-1.5 border-t border-dashed border-gray-300">
        Kebab Gatsu App
      </div>
    </div>
  )
}
