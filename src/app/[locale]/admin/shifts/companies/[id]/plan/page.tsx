'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SHIFT_LABELS: Record<string, string> = {
  morning: 'Ranní',
  afternoon: 'Odpolední',
  night: 'Noční',
}

const DAY_LABELS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']

type ShiftTimes = Record<string, { start: string; end: string }>

interface Company {
  id: string
  name: string
  shift_types: string[]
  shift_times: ShiftTimes
}

interface Department {
  id: string
  name: string
  active: boolean
  shift_types: string[] | null
  shift_times: ShiftTimes | null
}

interface Worker {
  id: string
  name: string
}

interface Requirement {
  id: string
  date: string
  shift_type: string
  required_count: number
}

interface Assignment {
  id: string
  worker_id: string
  date: string
  shift_type: string
  worker_name: string
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function formatDayLabel(d: Date): string {
  return `${DAY_LABELS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`
}

// Pondělí týdne obsahujícího `date`
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=neděle
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function ShiftPlanPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<Company | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [busySet, setBusySet] = useState<Set<string>>(new Set()) // "workerId|date|shiftType" napříč všemi firmami
  const [deptTotals, setDeptTotals] = useState<Record<string, number>>({})
  const [anchorMonday, setAnchorMonday] = useState<Date>(() => getMonday(new Date()))
  const [addingCell, setAddingCell] = useState<string | null>(null) // "date|shiftType"

  // 8 sloupců: neděle předchozího týdne + pondělí..neděle aktuálního týdne
  const days: Date[] = []
  const prevSunday = new Date(anchorMonday)
  prevSunday.setDate(prevSunday.getDate() - 1)
  days.push(prevSunday)
  for (let i = 0; i < 7; i++) {
    const d = new Date(anchorMonday)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  const rangeStart = formatDate(days[0])
  const rangeEnd = formatDate(days[days.length - 1])

  // Základní data: firma, provozy, pracovníci
  useEffect(() => {
    const load = async () => {
      const [{ data: companyData }, { data: deptData }, { data: workerLinks }] = await Promise.all([
        supabase.from('shift_companies').select('*').eq('id', params.id).single(),
        supabase.from('shift_departments').select('*').eq('company_id', params.id).eq('active', true).order('created_at'),
        supabase.from('shift_worker_companies').select('shift_workers(id, name)').eq('company_id', params.id),
      ])
      setCompany(companyData)
      setDepartments(deptData ?? [])
      if ((deptData ?? []).length > 0) setSelectedDeptId(deptData![0].id)
      const eligibleWorkers = (workerLinks ?? [])
        .map((w: any) => w.shift_workers)
        .filter(Boolean)
        .filter((w: any) => w.active !== false)
      setWorkers(eligibleWorkers)
      setLoading(false)
    }
    load()
  }, [params.id])

  // Data závislá na rozsahu dat: požadavky, přiřazení, konflikty
  const loadRangeData = useCallback(async () => {
    if (departments.length === 0) return
    const deptIds = departments.map(d => d.id)

    const [{ data: reqData }, { data: allAssignments }] = await Promise.all([
      supabase.from('shift_requirements').select('*').in('department_id', deptIds).gte('date', rangeStart).lte('date', rangeEnd),
      supabase.from('shift_assignments').select('*, shift_workers(name)').gte('date', rangeStart).lte('date', rangeEnd),
    ])

    // Součty pro štítky u tabů (za celý zobrazený rozsah)
    const totals: Record<string, number> = {}
    ;(reqData ?? []).forEach((r: any) => {
      totals[r.department_id] = (totals[r.department_id] ?? 0) + (r.required_count ?? 0)
    })
    setDeptTotals(totals)
    setRequirements((reqData ?? []).filter((r: any) => r.department_id === selectedDeptId))

    const busy = new Set<string>()
    ;(allAssignments ?? []).forEach((a: any) => {
      busy.add(`${a.worker_id}|${a.date}|${a.shift_type}`)
    })
    setBusySet(busy)

    setAssignments(
      (allAssignments ?? [])
        .filter((a: any) => a.department_id === selectedDeptId)
        .map((a: any) => ({ id: a.id, worker_id: a.worker_id, date: a.date, shift_type: a.shift_type, worker_name: a.shift_workers?.name ?? '?' }))
    )
  }, [departments, selectedDeptId, rangeStart, rangeEnd])

  useEffect(() => {
    loadRangeData()
  }, [loadRangeData])

  const selectedDept = departments.find(d => d.id === selectedDeptId) ?? null
  const shiftTypes = selectedDept?.shift_types ?? company?.shift_types ?? []
  const shiftTimesForDept = selectedDept?.shift_times ?? company?.shift_times ?? {}

  const getRequirement = (date: string, shiftType: string) =>
    requirements.find(r => r.date === date && r.shift_type === shiftType)

  const getAssignmentsFor = (date: string, shiftType: string) =>
    assignments.filter(a => a.date === date && a.shift_type === shiftType)

  const updateRequirement = async (date: string, shiftType: string, count: number) => {
    if (!selectedDeptId) return
    const existing = getRequirement(date, shiftType)
    if (existing) {
      await supabase.from('shift_requirements').update({ required_count: count }).eq('id', existing.id)
    } else {
      await supabase.from('shift_requirements').insert({
        department_id: selectedDeptId,
        date,
        shift_type: shiftType,
        required_count: count,
      })
    }
    loadRangeData()
  }

  const addAssignment = async (date: string, shiftType: string, workerId: string) => {
    if (!selectedDeptId) return
    const { error } = await supabase.from('shift_assignments').insert({
      department_id: selectedDeptId,
      worker_id: workerId,
      date,
      shift_type: shiftType,
    })
    if (error) {
      if (error.code === '23505') {
        alert('Tento pracovník je na danou směnu už přiřazen jinde.')
      } else {
        alert('Chyba: ' + error.message)
      }
    }
    setAddingCell(null)
    loadRangeData()
  }

  const removeAssignment = async (id: string) => {
    await supabase.from('shift_assignments').delete().eq('id', id)
    loadRangeData()
  }

  const eligibleWorkersFor = (date: string, shiftType: string) => {
    const alreadyHere = new Set(getAssignmentsFor(date, shiftType).map(a => a.worker_id))
    return workers.filter(w => {
      if (alreadyHere.has(w.id)) return false
      const key = `${w.id}|${date}|${shiftType}`
      return !busySet.has(key)
    })
  }

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>
  if (!company) return <div className="text-sm text-gray-400">Firma nenalezena</div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.push('/admin/shifts/companies')} className="text-sm text-gray-400 hover:text-gray-600">← Zpět na firmy</button>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Plánování směn – {company.name}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { const d = new Date(anchorMonday); d.setDate(d.getDate() - 7); setAnchorMonday(d) }}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            ← Předchozí týden
          </button>
          <span className="text-sm text-gray-500">
            {formatDayLabel(days[0])} – {formatDayLabel(days[days.length - 1])}
          </span>
          <button
            onClick={() => { const d = new Date(anchorMonday); d.setDate(d.getDate() + 7); setAnchorMonday(d) }}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            Další týden →
          </button>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Nejdřív založte alespoň jeden provoz.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className="text-sm px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2"
                style={{
                  borderColor: selectedDeptId === dept.id ? '#2a4f2d' : 'transparent',
                  color: selectedDeptId === dept.id ? '#2a4f2d' : '#6b7280',
                  fontWeight: selectedDeptId === dept.id ? 500 : 400,
                }}
              >
                {dept.name}
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: selectedDeptId === dept.id ? '#2a4f2d' : '#e5e7eb', color: selectedDeptId === dept.id ? '#fff' : '#6b7280' }}
                >
                  {deptTotals[dept.id] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {shiftTypes.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400 text-sm">Tento provoz nemá nastavené žádné směny.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '900px' }}>
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400" style={{ width: '110px' }}></th>
                    {days.map((d) => (
                      <th key={formatDate(d)} className="text-left px-3 py-3 text-xs font-medium text-gray-500" style={{ minWidth: '150px' }}>
                        {formatDayLabel(d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shiftTypes.map((shiftType) => {
                    const times = shiftTimesForDept[shiftType]
                    return (
                      <tr key={shiftType} className="border-b border-gray-50 align-top">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{SHIFT_LABELS[shiftType] ?? shiftType}</div>
                          {times && <div className="text-xs text-gray-400">{times.start} - {times.end}</div>}
                        </td>
                        {days.map((d) => {
                          const date = formatDate(d)
                          const req = getRequirement(date, shiftType)
                          const cellAssignments = getAssignmentsFor(date, shiftType)
                          const cellKey = `${date}|${shiftType}`
                          const eligible = eligibleWorkersFor(date, shiftType)
                          return (
                            <td key={cellKey} className="px-3 py-3 border-l border-gray-50">
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-xs text-gray-400">Potřeba:</span>
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={req?.required_count ?? 0}
                                  onBlur={(e) => updateRequirement(date, shiftType, parseInt(e.target.value) || 0)}
                                  className="text-xs border border-gray-200 rounded px-1.5 py-0.5"
                                  style={{ width: '48px' }}
                                />
                                <span className="text-xs text-gray-400">
                                  ({cellAssignments.length}/{req?.required_count ?? 0})
                                </span>
                              </div>
                              <div className="space-y-1 mb-2">
                                {cellAssignments.map((a) => (
                                  <div key={a.id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                                    <span className="text-gray-700">{a.worker_name}</span>
                                    <button onClick={() => removeAssignment(a.id)} className="text-red-400 hover:text-red-600 ml-2">×</button>
                                  </div>
                                ))}
                              </div>
                              {addingCell === cellKey ? (
                                <select
                                  autoFocus
                                  defaultValue=""
                                  onChange={(e) => { if (e.target.value) addAssignment(date, shiftType, e.target.value) }}
                                  onBlur={() => setAddingCell(null)}
                                  className="text-xs border border-gray-200 rounded px-1.5 py-1 w-full"
                                >
                                  <option value="" disabled>Vybrat pracovníka...</option>
                                  {eligible.length === 0 && <option value="" disabled>Žádní volní pracovníci</option>}
                                  {eligible.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                              ) : (
                                <button
                                  onClick={() => setAddingCell(cellKey)}
                                  className="text-xs w-full text-left px-1"
                                  style={{ color: '#2a4f2d' }}
                                >
                                  + přidat pracovníka
                                </button>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
