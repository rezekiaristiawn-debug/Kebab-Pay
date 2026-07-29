import { useState, useEffect, useCallback } from 'react'
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

function dateStr(d: Date) {
  return d.toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function ReceiptCard({ report, onPrint }: {
  report: ClosingReport
  onPrint: () => void
}) {
  return (
    <div className="bg-white w-56 border-2 border-dashed border-gray-400 p-3 text-xs leading-snug">
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
          <span className="truncate">: {dateStr(new Date(report.tanggal))}</span>
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
      </div>
      <div className="border-t-2 border-dashed border-gray-400 pt-1.5 mt-1.5">
        <div className="flex justify-between text-sm">
          <span className="font-bold text-gray-900">OMSET BERSIH</span>
          <span className="font-bold text-gray-900">Rp {report.omset_bersih.toLocaleString('id-ID')}</span>
        </div>
      </div>
      <div className="flex gap-1 mt-2 justify-end no-print">
        <button onClick={onPrint} className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-medium rounded hover:bg-gray-800 transition-colors cursor-pointer">
          Print
        </button>
      </div>
    </div>
  )
}

export default function Laporan() {
  const [reports, setReports] = useState<ClosingReport[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    supabase
      .from('closing_reports')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          supabase.from('closing_reports').select('*').order('created_at', { ascending: false }).then(({ data: d2 }) => {
            if (d2) setReports(d2 as ClosingReport[])
            setLoading(false)
          })
          return
        }
        if (data) setReports(data as ClosingReport[])
        setLoading(false)
      })
  }, [])

  useEffect(() => { load() }, [load])

  const handlePrintOne = async (report: ClosingReport) => {
    await supabase.from('closing_reports').update({ archived: true }).eq('id', report.id)
    setReports((prev) => prev.filter((r) => r.id !== report.id))
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(printHtml([report]))
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 200)
  }

  const handlePrintAll = async () => {
    const ids = reports.map((r) => r.id)
    const { error } = await supabase.from('closing_reports').update({ archived: true }).in('id', ids)
    if (!error) setReports([])
    else alert('Gagal mengarsip: ' + error.message)
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(printHtml(reports))
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 200)
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900">Laporan dari Kru</h1>
          <div className="flex items-center gap-2">
            {reports.length > 0 && (
              <button
                onClick={handlePrintAll}
                className="no-print px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
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
                <ReceiptCard
                  report={r}
                  onPrint={() => handlePrintOne(r)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function printHtml(reports: ClosingReport[]) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Cetak Laporan</title>
<style>
  body { font-family: 'Courier New', monospace; margin: 0; padding: 24px 16px; }
  .receipt { border: 2px dashed #333; padding: 16px; margin-bottom: 16px; max-width: 400px; margin-left: auto; margin-right: auto; page-break-after: always; }
  .receipt:last-child { page-break-after: auto; }
  .receipt h2 { text-align: center; font-size: 14px; border-bottom: 1px dashed #333; padding-bottom: 8px; margin: 0 0 8px; }
  .receipt .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
  .receipt .row .label { color: #666; }
  .receipt .row .value { font-weight: bold; }
  .receipt .divider { border-top: 1px dashed #333; margin: 6px 0; }
  .receipt .divider2 { border-top: 2px dashed #333; margin: 8px 0; }
  .receipt .total { font-weight: bold; font-size: 14px; }
  .receipt .footer { text-align: center; color: #999; font-size: 8px; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #ccc; }
  .no-print { display: none; }
</style>
</head>
<body>
${reports.map((r) => {
  const d = new Date(r.tanggal)
  const ds = d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  return `<div class="receipt">
    <h2>LAPORAN HARIAN</h2>
    <div class="row"><span class="label">Lapak</span><span class="value">: ${r.nama_lapak}</span></div>
    <div class="row"><span class="label">Tanggal</span><span>: ${ds}</span></div>
    <div class="divider"></div>
    <div class="row"><span class="label">Omset Kotor</span><span class="value">Rp ${r.omset_kotor.toLocaleString('id-ID')}</span></div>
    <div class="row"><span class="label">Gaji Kru (10%)</span><span class="value">Rp ${r.gaji_kru.toLocaleString('id-ID')}</span></div>
    ${r.pengeluaran && r.pengeluaran.length > 0 ? `<div class="divider"></div><div style="font-weight:600;font-size:12px;margin:4px 0 2px">Pengeluaran</div>${r.pengeluaran.map((e: { name: string; amount: number }) => `<div class="row" style="margin-left:12px"><span>${e.name}</span><span>Rp ${e.amount.toLocaleString('id-ID')}</span></div>`).join('')}<div class="divider"></div><div class="row"><span>Total</span><span class="value">Rp ${r.total_pengeluaran.toLocaleString('id-ID')}</span></div>` : ''}
    <div class="divider2"></div>
    <div class="row total"><span>OMSET BERSIH</span><span>Rp ${r.omset_bersih.toLocaleString('id-ID')}</span></div>
    <div class="footer">Kebab Gatsu App</div>
  </div>`
}).join('')}
</body>
</html>`
}
