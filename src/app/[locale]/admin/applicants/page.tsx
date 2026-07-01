'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const t = {
  cs: {
    title: 'Žadatelé',
    total: 'celkem',
    all: 'Vše',
    empty: 'Žádní žadatelé',
    loading: 'Načítám...',
    colName: 'Jméno',
    colPosition: 'Pozice',
    colLocation: 'Lokalita',
    colDate: 'Datum',
    colStatus: 'Stav',
    detail: 'Detail',
    delete: 'Smazat',
    confirmDelete: 'Opravdu smazat žadatele',
    statuses: {
      new: { label: 'Nový', bg: '#eff6ff', color: '#3b82f6' },
      reviewing: { label: 'Probíhá', bg: '#fef3e6', color: '#e07b0a' },
      invited: { label: 'Pozván', bg: '#eaf3e8', color: '#2a4f2d' },
      rejected: { label: 'Zamítnut', bg: '#fef2f2', color: '#ef4444' },
      hired: { label: 'Přijat', bg: '#2a4f2d', color: '#fff' },
    },
  },
  de: {
    title: 'Bewerber',
    total: 'gesamt',
    all: 'Alle',
    empty: 'Keine Bewerber',
    loading: 'Laden...',
    colName: 'Name',
    colPosition: 'Position',
    colLocation: 'Standort',
    colDate: 'Datum',
    colStatus: 'Status',
    detail: 'Details',
    delete: 'Löschen',
    confirmDelete: 'Bewerber wirklich löschen',
    statuses: {
      new: { label: 'Neu', bg: '#eff6ff', color: '#3b82f6' },
      reviewing: { label: 'In Bearbeitung', bg: '#fef3e6', color: '#e07b0a' },
      invited: { label: 'Eingeladen', bg: '#eaf3e8', color: '#2a4f2d' },
      rejected: { label: 'Abgelehnt', bg: '#fef2f2', color: '#ef4444' },
      hired: { label: 'Eingestellt', bg: '#2a4f2d', color: '#fff' },
    },
  },
}

export default function AdminApplicantsPage() {
  const [applicants, setApplicants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [lang, setLang] = useState<'cs' | 'de'>('cs')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.role === 'superadmin') setIsSuperadmin(true)
      const userLang = user?.user_metadata?.lang ?? 'cs'
      setLang(userLang as 'cs' | 'de')
    })
    loadApplicants()
  }, [])

  const loadApplicants = async () => {
    const { data } = await supabase
      .from('applicants')
      .select('*, job:jobs(title_cs, location)')
      .order('created_at', { ascending: false })
    setApplicants(data ?? [])
    setLoading(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${tr.confirmDelete} ${name}?`)) return
    await supabase.from('applicants').delete().eq('id', id)
    setApplicants(prev => prev.filter(a => a.id !== id))
  }

  const tr = t[lang]
  const filtered = filter === 'all' ? applicants : applicants.filter(a => a.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>{tr.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{applicants.length} {tr.total}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'new', 'reviewing', 'invited', 'hired', 'rejected'] as const).map((s) => (
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
              {s === 'all' ? tr.all : tr.statuses[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">{tr.loading}</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">{tr.empty}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">{tr.colName}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">{tr.colPosition}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">{tr.colLocation}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">{tr.colDate}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">{tr.colStatus}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a) => {
                const s = tr.statuses[a.status as keyof typeof tr.statuses] ?? tr.statuses.new
                return (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-medium" style={{ color: '#1a1a1a' }}>
                      {a.first_name} {a.last_name}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{a.job?.title_cs ?? '–'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{a.job?.location ?? '–'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleDateString('cs-CZ')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <Link href={`/admin/applicants/${a.id}`} className="text-xs" style={{ color: '#2a4f2d' }}>
                        {tr.detail}
                      </Link>
                      {isSuperadmin && (
                        <button
                          onClick={() => handleDelete(a.id, `${a.first_name} ${a.last_name}`)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          {tr.delete}
                        </button>
                      )}
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
