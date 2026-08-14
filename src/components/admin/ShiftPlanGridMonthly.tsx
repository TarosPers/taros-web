'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SHIFT_CODES: Record<string, string> = {
  morning: 'R',
  afternoon: 'O',
  night: 'N',
}

const DAY_LABELS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
]

type ShiftTimes = Record<string, { start: string; end: string }>

interface Company {
  id: string
  name: string
  shift_types: string[]
}

interface Department {
  id: string
  name: string
  abbreviation: string | null
  color: string
  active: boolean
  shift_types: string[] | null
}

interface Worker {
  id: string
  name: string
}

interface Requirement {
  department_id: string
  date: string
  shift_type: string
  required_count: number
}

interface RawAssignment {
  id: string
  worker_id: string
  department_id: string
  date: string
  shift_type: string
  company_id: string // odvozeno z shift_departments
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getMonthDays(anchorMonth: Date): Date[] {
  const year = anchorMonth.getFullYear()
  const month = anchorMonth.getMonth()
  const lastDayPrevMonth = new Date(year, month, 0)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = [lastDayPrevMonth]
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d))
  }
  return days
}

export default function ShiftPlanGridMonthly({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<Company | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [assignments, setAssignments] = useState<RawAssignment[]>([])
  const [anchorMonth, setAnchorMonth] = useState<Date>(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const days = getMonthDays(anchorMonth)
  const rangeStart = formatDate(days[0])
  const rangeEnd = formatDate(days[days.length - 1])
  const shiftTypes = company?.shift_types ?? []

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: companyData }, { data: deptData }, { data: workerLinks }] = await Promise.all([
        supabase.from('shift_companies').select('id, name, shift_types').eq('id', companyId).single(),
        supabase.from('shift_departments').select('*').eq('company_id', companyId).eq('active', true).order('name'),
        supabase.from('shift_worker_companies').select('shift_workers(id, name)').eq('company_id', companyId),
      ])
      setCompany(companyData)
      setDepartments(deptData ?? [])
      const eligibleWorkers = (workerLinks ?? [])
        .map((w: any) => w.shift_workers)
        .filter(Boolean)
        .filter((w: any) => w.active !== false)
        .sort((a: Worker, b: Worker) => a.name.localeCompare(b.name))
      setWorkers(eligibleWorkers)
      setLoading(false)
    }
    load()
  }, [companyId])

  const loadRangeData = useCallback(async () => {
    if (!company) return
    const deptIds = departments.map(d => d.id)

    const [{ data: reqData }, { data: allAssignments }] = await Promise.all([
      deptIds.length > 0
        ? supabase.from('shift_requirements').select('department_id, date, shift_type, required_count').in('department_id', deptIds).gte('date', rangeStart).lte('date', rangeEnd)
        : Promise.resolve({ data: [] }),
      supabase.from('shift_assignments').select('id, worker_id, department_id, date, shift_type, shift_departments(company_id)').gte('date', rangeStart).lte('date', rangeEnd),
    ])

    setRequirements(reqData ?? [])
    setAssignments(
      (allAssignments ?? []).map((a: any) => ({
        id: a.id,
        worker_id: a.worker_id,
        department_id: a.department_id,
        date: a.date,
        shift_type: a.shift_type,
        company_id: a.shift_departments?.company_id ?? '',
      }))
    )
  }, [company, departments, rangeStart, rangeEnd])

  useEffect(() => {
    loadRangeData()
  }, [loadRangeData])

  const effectiveShiftTypes = (dept: Department) => dept.shift_types ?? shiftTypes

  const getRequirement = (deptId: string, date: string, shiftType: string) =>
    requirements.find(r => r.department_id === deptId && r.date === date && r.shift_type === shiftType)?.required_count ?? 0

  const updateRequirement = async (deptId: string, date: string, shiftType: string, count: number) => {
    const existing = requirements.find(r => r.department_id === deptId && r.date === date && r.shift_type === shiftType)
    if (existing) {
      await supabase.from('shift_requirements').update({ required_count: count })
        .eq('department_id', deptId).eq('date', date).eq('shift_type', shiftType)
    } else {
      await supabase.from('shift_requirements').insert({ department_id: deptId, date, shift_type: shiftType, required_count: count })
    }
    loadRangeData()
  }

  const getPotreba = (date: string, shiftType: string) =>
    departments
      .filter(d => effectiveShiftTypes(d).includes(shiftType))
      .reduce((sum, d) => sum + getRequirement(d.id, date, shiftType), 0)

  const getMam = (date: string, shiftType: string) =>
    assignments.filter(a => a.date === date && a.shift_type === shiftType && a.company_id === companyId).length

  const getWorkerAssignment = (workerId: string, date: string, shiftType: string) =>
    assignments.find(a => a.worker_id === workerId && a.date === date && a.shift_type === shiftType)

  const selectDeptForWorkerCell = async (workerId: string, date: string, shiftType: string, deptId: string) => {
    const existing = getWorkerAssignment(workerId, date, shiftType)

    if (!deptId) {
      if (existing) await supabase.from('shift_assignments').delete().eq('id', existing.id)
      loadRangeData()
      return
    }

    if (existing) {
      if (existing.department_id === deptId) return
      const { error } = await supabase.from('shift_assignments').update({ department_id: deptId }).eq('id', existing.id)
      if (error) alert('Chyba: ' + error.message)
    } else {
      const { error } = await supabase.from('shift_assignments').insert({
        department_id: deptId, worker_id: workerId, date, shift_type: shiftType,
      })
      if (error) alert(error.code === '23505' ? 'Tento pracovník je na danou směnu už přiřazen jinde.' : 'Chyba: ' + error.message)
    }
    loadRangeData()
  }

  const goToPrevMonth = () => { const d = new Date(anchorMonth); d.setMonth(d.getMonth() - 1); setAnchorMonth(d) }
  const goToNextMonth = () => { const d = new Date(anchorMonth); d.setMonth(d.getMonth() + 1); setAnchorMonth(d) }

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>
  if (!company) return <div className="text-sm text-gray-400">Firma nenalezena</div>

  const cellWidth = 26
  const labelWidth = 150

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2">
          <button onClick={goToPrevMonth} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">← Předchozí</button>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap" style={{ minWidth: '140px', textAlign: 'center' }}>
            {MONTH_NAMES[anchorMonth.getMonth()]} {anchorMonth.getFullYear()}
          </span>
          <button onClick={goToNextMonth} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">Další →</button>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Nejdřív založte alespoň jeden provoz pro tuto firmu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-2 overflow-x-auto">
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="sticky left-0 bg-white z-20" style={{ minWidth: labelWidth, width: labelWidth }} rowSpan={2}></th>
                {days.map((d) => (
                  <th
                    key={formatDate(d)}
                    colSpan={shiftTypes.length}
                    className="text-center text-xs font-medium text-gray-500 border-l border-gray-100"
                    style={{ padding: '4px 0' }}
                  >
                    <div>{d.getDate()}</div>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>{DAY_LABELS[d.getDay()]}</div>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-gray-200">
                {days.map((d) =>
                  shiftTypes.map((s, i) => (
                    <th
                      key={`${formatDate(d)}-${s}`}
                      className="text-center text-gray-400 border-l border-gray-50"
                      style={{ width: cellWidth, minWidth: cellWidth, fontSize: '9px', fontWeight: 400, borderLeft: i === 0 ? '1px solid #e5e7eb' : undefined }}
                    >
                      {SHIFT_CODES[s] ?? s[0]}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {/* Řádky provozů - editovatelná potřeba */}
              {departments.map((dept) => {
                const deptShifts = effectiveShiftTypes(dept)
                return (
                  <tr key={dept.id} className="border-b border-gray-50">
                    <td className="sticky left-0 bg-white z-10 px-2 py-1" style={{ minWidth: labelWidth, width: labelWidth }}>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full flex-shrink-0" style={{ width: '8px', height: '8px', background: dept.color }} />
                        <span className="text-xs font-medium truncate" style={{ color: '#1a1a1a' }} title={dept.name}>
                          {dept.abbreviation || dept.name}
                        </span>
                      </div>
                    </td>
                    {days.map((d) => {
                      const date = formatDate(d)
                      return shiftTypes.map((s, i) => {
                        const applicable = deptShifts.includes(s)
                        return (
                          <td key={`${date}-${s}`} className="text-center" style={{ width: cellWidth, minWidth: cellWidth, borderLeft: i === 0 ? '1px solid #e5e7eb' : undefined }}>
                            {applicable ? (
                              <input
                                type="number"
                                min={0}
                                defaultValue={getRequirement(dept.id, date, s)}
                                onBlur={(e) => updateRequirement(dept.id, date, s, parseInt(e.target.value) || 0)}
                                className="border-0 text-center bg-transparent"
                                style={{ width: cellWidth - 4, fontSize: '10px', padding: '2px 0' }}
                              />
                            ) : (
                              <div style={{ height: '20px', background: '#fafafa' }} />
                            )}
                          </td>
                        )
                      })
                    })}
                  </tr>
                )
              })}

              {/* Souhrny */}
              {[
                { label: 'Potřeba', fn: getPotreba, style: { color: '#1a1a1a', fontWeight: 600 } },
                { label: 'Mám',     fn: getMam,     style: { color: '#2a4f2d', fontWeight: 600 } },
                { label: 'Zbývá',   fn: (date: string, s: string) => getPotreba(date, s) - getMam(date, s), style: { fontWeight: 600 } },
              ].map(({ label, fn, style }) => (
                <tr key={label} style={{ background: '#f2f8f1' }} className="border-b border-gray-100">
                  <td className="sticky left-0 z-10 px-2 py-1 text-xs font-semibold" style={{ minWidth: labelWidth, width: labelWidth, background: '#f2f8f1', color: '#1a1a1a' }}>
                    {label}
                  </td>
                  {days.map((d) => {
                    const date = formatDate(d)
                    return shiftTypes.map((s, i) => {
                      const value = fn(date, s)
                      const isZbyva = label === 'Zbývá'
                      const color = isZbyva ? (value > 0 ? '#ef4444' : value < 0 ? '#e07b0a' : '#9ca3af') : style.color
                      return (
                        <td
                          key={`${date}-${s}`}
                          className="text-center"
                          style={{ width: cellWidth, minWidth: cellWidth, fontSize: '10px', fontWeight: style.fontWeight, color, borderLeft: i === 0 ? '1px solid #e5e7eb' : undefined }}
                        >
                          {value}
                        </td>
                      )
                    })
                  })}
                </tr>
              ))}

              {/* Řádky pracovníků */}
              {workers.map((worker) => (
                <tr key={worker.id} className="border-b border-gray-50">
                  <td className="sticky left-0 bg-white z-10 px-2 py-1" style={{ minWidth: labelWidth, width: labelWidth }}>
                    <span className="text-xs truncate" style={{ color: '#374151' }} title={worker.name}>{worker.name}</span>
                  </td>
                  {days.map((d) => {
                    const date = formatDate(d)
                    return shiftTypes.map((s, i) => {
                      const assignment = getWorkerAssignment(worker.id, date, s)
                      const isForeignCompany = assignment && assignment.company_id !== companyId
                      const options = departments.filter(dep => effectiveShiftTypes(dep).includes(s))

                      return (
                        <td key={`${date}-${s}`} className="text-center" style={{ width: cellWidth, minWidth: cellWidth, borderLeft: i === 0 ? '1px solid #e5e7eb' : undefined }}>
                          {isForeignCompany ? (
                            <div
                              title="Přiřazen jinde"
                              style={{ width: cellWidth - 6, height: '16px', margin: '2px auto', background: '#e5e7eb', borderRadius: '3px' }}
                            />
                          ) : (
                            <select
                              value={assignment?.department_id ?? ''}
                              onChange={(e) => selectDeptForWorkerCell(worker.id, date, s, e.target.value)}
                              className="border-0 text-center"
                              style={{
                                width: cellWidth,
                                fontSize: '9px',
                                padding: '2px 0',
                                background: assignment ? departments.find(dep => dep.id === assignment.department_id)?.color + '33' : 'transparent',
                                color: assignment ? departments.find(dep => dep.id === assignment.department_id)?.color : '#9ca3af',
                                fontWeight: assignment ? 600 : 400,
                              }}
                            >
                              <option value="">–</option>
                              {options.map(dep => (
                                <option key={dep.id} value={dep.id}>{dep.abbreviation || dep.name}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      )
                    })
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legenda zkratek provozů */}
          <div className="flex flex-wrap gap-3 mt-4 px-2 pb-1">
            {departments.map((dept) => (
              <div key={dept.id} className="flex items-center gap-1.5">
                <span className="rounded-full" style={{ width: '8px', height: '8px', background: dept.color }} />
                <span className="text-xs text-gray-500">{dept.abbreviation || '?'} – {dept.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
