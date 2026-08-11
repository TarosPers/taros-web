'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SHIFT_LABELS: Record<string, string> = {
  morning: 'Ranní',
  afternoon: 'Odpolední',
  night: 'Noční',
}

interface Company {
  id: string
  name: string
  shift_types: string[]
  shift_times: Record<string, { start: string; end: string }>
}

interface Department {
  id: string
  name: string
  active: boolean
  shift_types: string[] | null
  shift_times: Record<string, { start: string; end: string }> | null
}

export default function ShiftDepartmentsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [params.id])

  const load = async () => {
    const [{ data: companyData }, { data: deptData }] = await Promise.all([
      supabase.from('shift_companies').select('*').eq('id', params.id).single(),
      supabase.from('shift_departments').select('*').eq('company_id', params.id).order('created_at', { ascending: false }),
    ])
    setCompany(companyData)
    setDepartments(deptData ?? [])
    setLoading(false)
  }

  const deleteDept = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm('Opravdu smazat tento provoz? Smažou se i jeho požadavky a přiřazení.')) return
    await supabase.from('shift_departments').delete().eq('id', id)
    load()
  }

  const formatShifts = (dept: Department): string => {
    const shiftTypes = dept.shift_types ?? company?.shift_types ?? []
    const times = dept.shift_times ?? company?.shift_times ?? {}
    return shiftTypes
      .map(s => {
        const t = times[s]
        if (!t) return SHIFT_LABELS[s] ?? s
        return `${SHIFT_LABELS[s] ?? s} ${t.start}–${t.end}`
      })
      .join(', ')
  }

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>
  if (!company) return <div className="text-sm text-gray-400">Firma nenalezena</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.push('/admin/shifts/companies')} className="text-sm text-gray-400 hover:text-gray-600">← Zpět na firmy</button>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Provozy – {company.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{departments.length} celkem</p>
        </div>
        <Link
          href={`/admin/shifts/companies/${params.id}/departments/new`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#2a4f2d' }}
        >
          + Nový provoz
        </Link>
      </div>

      {departments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">Zatím žádné provozy</p>
          <Link href={`/admin/shifts/companies/${params.id}/departments/new`} className="text-sm font-medium" style={{ color: '#2a4f2d' }}>
            Přidat první provoz →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Název</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Směny</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Stav</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-medium" style={{ color: '#1a1a1a' }}>
                    {dept.name}
                    {dept.shift_types && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#fdf0e0', color: '#e07b0a' }}>
                        vlastní nastavení
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{formatShifts(dept)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        background: dept.active ? '#eaf3e8' : '#f5f5f5',
                        color: dept.active ? '#2a4f2d' : '#9ca3af',
                      }}
                    >
                      {dept.active ? 'Aktivní' : 'Neaktivní'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/shifts/companies/${params.id}/departments/${dept.id}`} className="text-xs" style={{ color: '#2a4f2d' }}>
                        Upravit
                      </Link>
                      <button onClick={(e) => deleteDept(e, dept.id)} className="text-xs text-red-400 hover:text-red-600">
                        Smazat
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
