'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  new:       { label: 'Nový',      bg: '#eff6ff', color: '#3b82f6' },
  reviewing: { label: 'Probíhá',  bg: '#fef3e6', color: '#e07b0a' },
  invited:   { label: 'Pozván',   bg: '#eaf3e8', color: '#2a4f2d' },
  rejected:  { label: 'Zamítnut', bg: '#fef2f2', color: '#ef4444' },
  hired:     { label: 'Přijat',   bg: '#2a4f2d', color: '#fff' },
}

export default function AdminQuestionnairesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase
      .from('questionnaires')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Dotazníky</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} celkem</p>
        </div>
        <div className="flex gap-2">
          {['all', 'new', 'reviewing', 'invited', 'hired', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{
                background: filter === s ? '#2a4f2d' : 'transparent',
                color: filter === s ? '#fff' : '#6b7280',
                borderColor: filter === s ? '#2a4f2d' : '#e5e7eb',
              }}
            >
              {s === 'all' ? 'Vše' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Načítám...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Žádné dotazníky</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Jméno</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">E-mail</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Telefon</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Profese</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Datum</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Stav</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((q) => {
                const s = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.new
                return (
                  <tr key={q.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium" style={{ color: '#1a1a1a' }}>
                      {q.first_name} {q.last_name}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{q.email}</td>
                    <td className="px-5 py-3.5 text-gray-500">{q.phone ?? '–'}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs max-w-[160px] truncate">{q.profese || q.profese_jina || '–'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(q.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/questionnaires/${q.id}`} className="text-xs" style={{ color: '#2a4f2d' }}>
                        Detail
                      </Link>
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
