import { useState, useEffect, useRef } from 'react'
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
  const receiptRef = useRef<HTMLDivElement>(null)
  const dateStr = new Date(report.tanggal).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div>
      <div ref={receiptRef} className="print-receipt bg-white max-w-sm mx-auto border border-gray-300 shadow-sm p-5 text-sm leading-relaxed">
        <div className="text-center border-b-2 border-gray-900 pb-3 mb-3">
          <p className="text-base font-bold tracking-wider text-gray-900">LAPORAN HARIAN</p>
          <p className="text-xs font-medium text-gray-600 tracking-widest uppercase">{report.nama_lapak}</p>
        </div>
        <div className="mb-3 text-gray-700 space-y-0.5">
          <div className="flex">
            <span className="w-16 text-gray-500">Lapak</span>
            <span className="font-semibold">: {report.nama_lapak}</span>
          </div>
          <div className="flex">
            <span className="w-16 text-gray-500">Tanggal</span>
            <span>: {dateStr}</span>
          </div>
        </div>
        <div className="border-t border-gray-900 pt-2 mb-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-700">Omset Kotor</span>
            <span className="font-bold text-gray-900">Rp {report.omset_kotor.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Gaji Kru (10%)</span>
            <span className="font-bold text-gray-900">Rp {report.gaji_kru.toLocaleString('id-ID')}</span>
          </div>
          {report.pengeluaran.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="font-semibold text-gray-700 mb-1">Pengeluaran</p>
              {report.pengeluaran.map((e, i) => (
                <div key={i} className="flex justify-between ml-3 text-gray-600">
                  <span>{e.name}</span>
                  <span>Rp {e.amount.toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 mt-1 pt-1">
                <span>Total Pengeluaran</span>
                <span>Rp {report.total_pengeluaran.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}
        </div>
        <div className="border-t-2 border-gray-900 pt-2 mt-2">
          <div className="flex justify-between text-base">
            <span className="font-bold text-gray-900">OMSET BERSIH</span>
            <span className="font-bold text-gray-900">Rp {report.omset_bersih.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-gray-500 mt-1">
            <span>Item Terjual</span>
            <span>{report.item_terjual} pcs</span>
          </div>
        </div>
        <div className="text-center text-gray-400 text-[10px] mt-3 pt-2 border-t border-gray-200">
          Dicetak dari Kebab Gatsu App
        </div>
      </div>
      <button
        onClick={onPrint}
        className="no-print mt-2 ml-auto px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 active:bg-gray-700 transition-colors cursor-pointer"
      >
        Print
      </button>
    </div>
  )
}

export default function Dashboard({ onBack }: { onBack: () => void }) {
  const [reports, setReports] = useState<ClosingReport[]>([])
  const [loading, setLoading] = useState(true)
  const [printReport, setPrintReport] = useState<ClosingReport | null>(null)

  useEffect(() => {
    supabase
      .from('closing_reports')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          alert('Gagal load data: ' + error.message)
        } else if (data) {
          setReports(data as ClosingReport[])
        }
        setLoading(false)
      })
  }, [])

  if (printReport) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">Dashboard Closing</h1>
          <button
            onClick={onBack}
            className="text-sm px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300 cursor-pointer"
          >
            Kembali
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-500">Belum ada data closing.</p>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
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
