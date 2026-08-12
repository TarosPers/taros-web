'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

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
  created_at: string
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatDayLabel(d: Date): string {
  return `${DAY_LABELS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function ShiftPlanGrid({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<Company | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [busySet, setBusySet] = useState<Set<string>>(new Set())
  const [deptTotals, setDeptTotals] = useState<Record<string, number>>({})
  const [anchorMonday, setAnchorMonday] = useState<Date>(() => getMonday(new Date()))

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

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: companyData }, { data: deptData }, { data: workerLinks }] = await Promise.all([
        supabase.from('shift_companies').select('*').eq('id', companyId).single(),
        supabase.from('shift_departments').select('*').eq('company_id', companyId).eq('active', true).order('created_at'),
        supabase.from('shift_worker_companies').select('shift_workers(id, name)').eq('company_id', companyId),
      ])
      setCompany(companyData)
      setDepartments(deptData ?? [])
      setSelectedDeptId((deptData ?? []).length > 0 ? deptData![0].id : null)
      const eligibleWorkers = (workerLinks ?? [])
        .map((w: any) => w.shift_workers)
        .filter(Boolean)
        .filter((w: any) => w.active !== false)
      setWorkers(eligibleWorkers)
      setLoading(false)
    }
    load()
  }, [companyId])

  const loadRangeData = useCallback(async () => {
    if (departments.length === 0) return
    const deptIds = departments.map(d => d.id)

    const [{ data: reqData }, { data: allAssignments }] = await Promise.all([
      supabase.from('shift_requirements').select('*').in('department_id', deptIds).gte('date', rangeStart).lte('date', rangeEnd),
      supabase.from('shift_assignments').select('*, shift_workers(name)').gte('date', rangeStart).lte('date', rangeEnd).order('created_at'),
    ])

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
        .map((a: any) => ({
          id: a.id,
          worker_id: a.worker_id,
          date: a.date,
          shift_type: a.shift_type,
          worker_name: a.shift_workers?.name ?? '?',
          created_at: a.created_at,
        }))
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
    assignments
      .filter(a => a.date === date && a.shift_type === shiftType)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))

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

  const selectWorkerForSlot = async (date: string, shiftType: string, slotIndex: number, workerId: string) => {
    if (!selectedDeptId) return
    const cellAssignments = getAssignmentsFor(date, shiftType)
    const existing = cellAssignments[slotIndex]

    if (!workerId) {
      if (existing) await supabase.from('shift_assignments').delete().eq('id', existing.id)
      loadRangeData()
      return
    }

    if (existing) {
      if (existing.worker_id === workerId) return
      const { error } = await supabase.from('shift_assignments').update({ worker_id: workerId }).eq('id', existing.id)
      if (error) alert(error.code === '23505' ? 'Tento pracovník je na danou směnu už přiřazen jinde.' : 'Chyba: ' + error.message)
    } else {
      const { error } = await supabase.from('shift_assignments').insert({
        department_id: selectedDeptId,
        worker_id: workerId,
        date,
        shift_type: shiftType,
      })
      if (error) alert(error.code === '23505' ? 'Tento pracovník je na danou směnu už přiřazen jinde.' : 'Chyba: ' + error.message)
    }
    loadRangeData()
  }

  const eligibleWorkersForSlot = (date: string, shiftType: string, slotIndex: number) => {
    const cellAssignments = getAssignmentsFor(date, shiftType)
    const currentSlotWorkerId = cellAssignments[slotIndex]?.worker_id
    const pickedInOtherSlots = cellAssignments
      .filter((_, idx) => idx !== slotIndex)
      .map(a => a.worker_id)

    return workers.filter(w => {
      if (pickedInOtherSlots.includes(w.id)) return false
      if (w.id === currentSlotWorkerId) return true
      const key = `${w.id}|${date}|${shiftType}`
      return !busySet.has(key)
    })
  }

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>
  if (!company) return <div className="text-sm text-gray-400">Firma nenalezena</div>

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { const d = new Date(anchorMonday); d.setDate(d.getDate() - 7); setAnchorMonday(d) }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            ← Předchozí
          </button>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatDayLabel(days[0])} – {formatDayLabel(days[days.length - 1])}
          </span>
          <button
            onClick={() => { const d = new Date(anchorMonday); d.setDate(d.getDate() + 7); setAnchorMonday(d) }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            Další →
          </button>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Nejdřív založte alespoň jeden provoz pro tuto firmu.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-4 border-b border-gray-200 overflow-x-auto">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className="text-sm px-3 py-2 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  borderColor: selectedDeptId === dept.id ? '#2a4f2d' : 'transparent',
                  color: selectedDeptId === dept.id ? '#2a4f2d' : '#6b7280',
                  fontWeight: selectedDeptId === dept.id ? 500 : 400,
                }}
              >
                {dept.name}
                <span
                  className="text-xs px-1.5 rounded-full"
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
            <div className="bg-white rounded-xl border border-gray-100 p-2">
              <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '80px' }} />
                  {days.map((d) => <col key={formatDate(d)} />)}
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-1.5 py-2"></th>
                    {days.map((d) => (
                      <th key={formatDate(d)} className="text-center px-1 py-2 font-medium text-gray-500">
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
                        <td className="px-1.5 py-2">
                          <div className="font-medium" style={{ color: '#1a1a1a' }}>{SHIFT_LABELS[shiftType] ?? shiftType}</div>
                          {times && <div className="text-gray-400" style={{ fontSize: '10px' }}>{times.start}-{times.end}</div>}
                        </td>
                        {days.map((d) => {
                          const date = formatDate(d)
                          const req = getRequirement(date, shiftType)
                          const requiredCount = req?.required_count ?? 0
                          const cellAssignments = getAssignmentsFor(date, shiftType)
                          const numSlots = Math.max(requiredCount, cellAssignments.length)

                          return (
                            <td key={`${date}|${shiftType}`} className="px-1 py-2 border-l border-gray-50 align-top">
                              <div className="flex items-center gap-1 mb-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  defaultValue={requiredCount}
                                  onBlur={(e) => updateRequirement(date, shiftType, parseInt(e.target.value) || 0)}
                                  className="border border-gray-200 rounded text-center"
                                  style={{ width: '32px', fontSize: '11px', padding: '1px' }}
                                  title="Potřeba míst"
                                />
                                <span className="text-gray-400" style={{ fontSize: '10px' }}>
                                  ({cellAssignments.length}/{requiredCount})
                                </span>
                              </div>
                              <div className="space-y-1">
                                {Array.from({ length: numSlots }).map((_, slotIndex) => {
                                  const currentWorkerId = cellAssignments[slotIndex]?.worker_id ?? ''
                                  const eligible = eligibleWorkersForSlot(date, shiftType, slotIndex)
                                  return (
                                    <select
                                      key={slotIndex}
                                      value={currentWorkerId}
                                      onChange={(e) => selectWorkerForSlot(date, shiftType, slotIndex, e.target.value)}
                                      className="w-full border border-gray-200 rounded"
                                      style={{ fontSize: '11px', padding: '2px' }}
                                    >
                                      <option value="">–</option>
                                      {eligible.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                      ))}
                                    </select>
                                  )
                                })}
                              </div>
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
