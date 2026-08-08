import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

const SQL = 'alter table public.closing_reports add column if not exists stok jsonb;'

export default function StokNotice() {
  const [missing, setMissing] = useState(false)
  const [checking, setChecking] = useState(true)

  const check = async () => {
    const { error } = await supabase.from('closing_reports').select('stok').limit(1)
    setMissing(error?.code === '42703')
    setChecking(false)
  }

  useEffect(() => {
    check()
  }, [])

  if (checking || !missing) return null

  return (
    <div className="border border-red-600 bg-red-50 p-4 mb-4 text-sm text-red-800">
      <p className="font-bold text-red-700 mb-1">Stok belum aktif: kolom `stok` belum ada di database.</p>
      <p className="mb-2">
        Laporan stok hanya muncul setelah kolom dibuat. Jalankan 1 baris SQL ini di{' '}
        <b>Supabase → SQL Editor</b>, lalu klik Run:
      </p>
      <pre className="bg-white border border-red-300 p-2 text-xs overflow-x-auto mb-2 select-all">{SQL}</pre>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => navigator.clipboard?.writeText(SQL)}
          className="px-3 py-1 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors cursor-pointer"
        >
          Salin SQL
        </button>
        <button
          onClick={() => { setChecking(true); setMissing(false); check() }}
          className="px-3 py-1 border border-red-600 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer"
        >
          Saya sudah jalankan
        </button>
      </div>
    </div>
  )
}
