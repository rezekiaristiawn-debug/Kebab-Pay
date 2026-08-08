import { supabase } from './supabase'

export interface Lapak {
  id: number
  no: number
  name: string
  shift: number
}

export const lapakLabel = (l: Lapak) => `${l.no} ${l.name}`

export function lapakNo(name: string): number {
  const m = /^\s*(\d+)/.exec(name)
  return m ? parseInt(m[1], 10) : NaN
}

export const byLapakOrder = (
  a: { nama_lapak: string; created_at: string },
  b: { nama_lapak: string; created_at: string },
): number => {
  const na = lapakNo(a.nama_lapak)
  const nb = lapakNo(b.nama_lapak)
  if (Number.isNaN(na) && Number.isNaN(nb)) return a.created_at.localeCompare(b.created_at)
  if (Number.isNaN(na)) return 1
  if (Number.isNaN(nb)) return -1
  if (na !== nb) return na - nb
  return a.created_at.localeCompare(b.created_at)
}

export async function listLapak(): Promise<Lapak[] | null> {
  const { data, error } = await supabase.from('lapak').select('*').order('no', { ascending: true })
  if (error) return null
  return data as Lapak[]
}
