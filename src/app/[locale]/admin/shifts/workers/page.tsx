'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Worker {
  id: string
  name: string
  active: boolean
  has_driving_license: boolean
  shift_worker_companies: { shift_companies: { id: string; name: string } | null }[]
}

export default function ShiftWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from('shift_workers')
      .select('*, shift_worker_companies(shift_companies(id, name))')
      .order('created_at', { ascending: false })
    setWorkers((data as any) ?? [])
    setLoading(false)
  }

  const deleteWorker = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm('Opravdu smazat tohoto pracovníka? Smažou se i jeho přiřazení ke směnám.')) return
    await supabase.from('shift_workers').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Pracovníci</h1>
          <p className="text-sm text-gray-400 mt-0.5">{workers.length} celkem</p>
        </div>
        <Link
          href="/admin/shifts/workers/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#2a4f2d' }}
        >
          + Nový pracovník
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Načítám...</p>
      ) : workers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">Zatím žádní pracovníci</p>
          <Link href="/admin/shifts/workers/new" className="text-sm font-medium" style={{ color: '#2a4f2d' }}>
            Přidat prvního pracovníka →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Jméno</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">ŘP</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Smí pracovat ve firmách</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Stav</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workers.map((worker) => {
                const companyNames = (worker.shift_worker_companies ?? [])
                  .map(wc => wc.shift_companies?.name)
                  .filter(Boolean)
                return (
                  <tr key={worker.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium" style={{ color: '#1a1a1a' }}>{worker.name}</td>
                    <td className="px-5 py-3.5">
                      {worker.has_driving_license ? (
                        <span className="text-xs" style={{ color: '#2a4f2d' }}>✓</span>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: '#fef2f2', color: '#ef4444' }}>
                          bez ŘP
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {companyNames.length > 0 ? companyNames.join(', ') : '–'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: worker.active ? '#eaf3e8' : '#f5f5f5',
                          color: worker.active ? '#2a4f2d' : '#9ca3af',
                        }}
                      >
                        {worker.active ? 'Aktivní' : 'Neaktivní'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/shifts/workers/${worker.id}`} className="text-xs" style={{ color: '#2a4f2d' }}>
                          Upravit
                        </Link>
                        <button onClick={(e) => deleteWorker(e, worker.id)} className="text-xs text-red-400 hover:text-red-600">
                          Smazat
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
