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
      <div ref={receiptRef} className="print-receipt bg-white max-w-sm mx-auto border-2 border-dashed border-gray-300 p-4 font-mono text-sm leading-relaxed">
        <div className="text-center border-b-2 border-black pb-2 mb-2">
          <p className="text-base font-bold tracking-widest">LAPORAN HARIAN</p>
          <p className="text-xs">KEBAB GATSU</p>
        </div>
        <div className="mb-2">
          <p>Lapak    : {report.nama_lapak}</p>
          <p>Tanggal  : {dateStr}</p>
        </div>
        <div className="border-t border-black pt-1 mb-1">
          <div className="flex justify-between">
            <span>Omset Kotor</span>
            <span className="font-bold">Rp {report.omset_kotor.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Gaji Kru (10%)</span>
            <span className="font-bold">Rp {report.gaji_kru.toLocaleString('id-ID')}</span>
          </div>
          {report.pengeluaran.length > 0 && (
            <div className="mt-1 pt-1 border-t border-gray-300">
              <p className="font-semibold mb-0.5">Pengeluaran:</p>
              {report.pengeluaran.map((e, i) => (
                <div key={i} className="flex justify-between text-xs ml-2">
                  <span>- {e.name}</span>
                  <span>Rp {e.amount.toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-bold ml-2">
                <span>Total</span>
                <span>Rp {report.total_pengeluaran.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}
        </div>
        <div className="border-t-2 border-black pt-1 mt-1">
          <div className="flex justify-between text-base">
            <span className="font-bold">OMSET BERSIH</span>
            <span className="font-bold">Rp {report.omset_bersih.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Item Terjual</span>
            <span>{report.item_terjual} pcs</span>
          </div>
        </div>
        <div className="text-center text-[10px] text-gray-400 mt-2 pt-1 border-t border-gray-200">
          Dicetak dari Kebab Gatsu App
        </div>
      </div>
      <button
        onClick={onPrint}
        className="no-print mt-2 w-full py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 cursor-pointer"
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
      <div className="max-w-4xl mx-auto">
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
          <div className="space-y-6">
            {reports.map((r) => (
              <div key={r.id}>
                <Receipt report={r} onPrint={() => setPrintReport(r)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
