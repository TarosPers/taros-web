'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Company {
  id: string
  name: string
  shift_types: string[]
  working_days: number[]
  active: boolean
  created_at: string
}

const t = {
  cs: {
    title: 'Firmy',
    total: 'celkem',
    new: '+ Nová firma',
    empty: 'Zatím žádné firmy',
    addFirst: 'Přidat první firmu →',
    colName: 'Název',
    colShifts: 'Směny',
    colDays: 'Pracovní dny',
    colStatus: 'Stav',
    active: 'Aktivní',
    hidden: 'Neaktivní',
    edit: 'Upravit',
    workers: 'Pracovníci',
    departments: 'Provozy',
    plan: 'Plánovat',
    delete: 'Smazat',
    confirmDelete: 'Opravdu smazat tuto firmu? Smažou se i všechny její provozy a přiřazení.',
    loading: 'Načítám...',
  },
  de: {
    title: 'Unternehmen',
    total: 'gesamt',
    new: '+ Neues Unternehmen',
    empty: 'Noch keine Unternehmen',
    addFirst: 'Erstes Unternehmen hinzufügen →',
    colName: 'Name',
    colShifts: 'Schichten',
    colDays: 'Arbeitstage',
    colStatus: 'Status',
    active: 'Aktiv',
    hidden: 'Inaktiv',
    edit: 'Bearbeiten',
    workers: 'Mitarbeiter',
    departments: 'Abteilungen',
    plan: 'Planen',
    delete: 'Löschen',
    confirmDelete: 'Dieses Unternehmen wirklich löschen? Alle Abteilungen und Zuweisungen werden ebenfalls gelöscht.',
    loading: 'Laden...',
  },
}

const SHIFT_LABELS: Record<string, { cs: string; de: string }> = {
  morning:   { cs: 'Ranní',      de: 'Früh' },
  afternoon: { cs: 'Odpolední',  de: 'Spät' },
  night:     { cs: 'Noční',      de: 'Nacht' },
}

const DAY_LABELS: Record<number, { cs: string; de: string }> = {
  1: { cs: 'Po', de: 'Mo' },
  2: { cs: 'Út', de: 'Di' },
  3: { cs: 'St', de: 'Mi' },
  4: { cs: 'Čt', de: 'Do' },
  5: { cs: 'Pá', de: 'Fr' },
  6: { cs: 'So', de: 'Sa' },
  7: { cs: 'Ne', de: 'So' },
}

export default function ShiftCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<'cs' | 'de'>('cs')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const userLang = user?.user_metadata?.lang ?? 'cs'
      setLang(userLang as 'cs' | 'de')
    })
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from('shift_companies')
      .select('*')
      .order('created_at', { ascending: false })
    setCompanies(data ?? [])
    setLoading(false)
  }

  const deleteCompany = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm(tr.confirmDelete)) return
    await supabase.from('shift_companies').delete().eq('id', id)
    load()
  }

  const tr = t[lang]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>{tr.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{companies.length} {tr.total}</p>
        </div>
        <Link
          href="/admin/shifts/companies/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#2a4f2d' }}
        >
          {tr.new}
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">{tr.loading}</p>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">{tr.empty}</p>
          <Link href="/admin/shifts/companies/new" className="text-sm font-medium" style={{ color: '#2a4f2d' }}>
            {tr.addFirst}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">{tr.colName}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">{tr.colShifts}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">{tr.colDays}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">{tr.colStatus}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-medium" style={{ color: '#1a1a1a' }}>{company.name}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {(company.shift_types ?? []).map(s => SHIFT_LABELS[s]?.[lang] ?? s).join(', ')}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {(company.working_days ?? []).map(d => DAY_LABELS[d]?.[lang] ?? d).join(', ')}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        background: company.active ? '#eaf3e8' : '#f5f5f5',
                        color: company.active ? '#2a4f2d' : '#9ca3af',
                      }}
                    >
                      {company.active ? tr.active : tr.hidden}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/shifts/companies/${company.id}`} className="text-xs" style={{ color: '#2a4f2d' }}>
                        {tr.edit}
                      </Link>
                      <Link href={`/admin/shifts/companies/${company.id}/departments`} className="text-xs text-gray-400 hover:text-gray-600">
                        {tr.departments}
                      </Link>
                      <Link href={`/admin/shifts/companies/${company.id}/plan`} className="text-xs text-gray-400 hover:text-gray-600">
                        {tr.plan}
                      </Link>
                      <button onClick={(e) => deleteCompany(e, company.id)} className="text-xs text-red-400 hover:text-red-600">
                        {tr.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
