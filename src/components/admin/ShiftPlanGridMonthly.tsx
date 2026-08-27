'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
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
  company_id: string
  confirmed: boolean
}

interface WorkerInterval {
  date: string
  shift_type: string
  start: Date
  end: Date
}

// Minimální zákonná přestávka mezi směnami (Arbeitszeitgesetz)
const MIN_REST_HOURS = 11

function computeInterval(dateStr: string, shiftType: string, times: ShiftTimes | undefined): { start: Date; end: Date } | null {
  const t = times?.[shiftType]
  if (!t) return null
  const start = new Date(`${dateStr}T${t.start}:00`)
  let end = new Date(`${dateStr}T${t.end}:00`)
  if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000) // směna přes půlnoc
  return { start, end }
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

const LABEL_WIDTH = 170
const MIN_CELL_WIDTH = 26
const VISIBLE_DAYS = 8

export default function ShiftPlanGridMonthly({
  companyId,
  initialDate,
  onDateChange,
}: {
  companyId: string
  initialDate?: Date
  onDateChange?: (date: Date) => void
}) {
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  // worker_id -> pole povolených department_id, nebo null = bez omezení (smí do všech provozů firmy)
  const [workerDeptEligibility, setWorkerDeptEligibility] = useState<Record<string, string[] | null>>({})
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [assignments, setAssignments] = useState<RawAssignment[]>([])
  const [workerIntervals, setWorkerIntervals] = useState<Record<string, WorkerInterval[]>>({})
  const [anchorMonth, setAnchorMonth] = useState<Date>(() => {
    const d = initialDate ? new Date(initialDate) : new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  // Zvyšuje se při každém úspěšném načtení dat - donutí needitovaná pole "Potřeba"
  // znovu se vykreslit se správnou hodnotou, i když se data z databáze načtou později.
  const [dataVersion, setDataVersion] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const [cellWidth, setCellWidth] = useState(MIN_CELL_WIDTH)

  const days = getMonthDays(anchorMonth)
  const rangeStart = formatDate(days[0])
  const rangeEnd = formatDate(days[days.length - 1])
  const shiftTypes = company?.shift_types ?? []

  // Dynamicky spočítat šířku buňky podle skutečné šířky okna prohlížeče,
  // ať se do dostupné šířky vejde přesně 8 celých dní.
  // Počítáno přímo z window.innerWidth (spolehlivější než měření vnořeného elementu).
  useEffect(() => {
    if (shiftTypes.length === 0) return

    const MAIN_PADDING = 32   // <main className="px-4"> = 16px na každé straně
    const CARD_PADDING = 16   // karta s tabulkou má p-2 = 8px na každé straně
    const EXTRA_SAFETY = 60   // svislý posuvník stránky, rámečky, zaokrouhlování - raději rezerva navíc

    const recalc = () => {
      const available = window.innerWidth - MAIN_PADDING - CARD_PADDING - EXTRA_SAFETY - LABEL_WIDTH
      const perCell = Math.floor(available / (VISIBLE_DAYS * shiftTypes.length))
      setCellWidth(Math.max(MIN_CELL_WIDTH, perCell))
    }

    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [shiftTypes.length])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: companyData }, { data: deptData }, { data: workerLinks }] = await Promise.all([
        supabase.from('shift_companies').select('id, name, shift_types, shift_times').eq('id', companyId).single(),
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

      // Zjistit omezení pracovníků na konkrétní provozy této firmy
      const workerIds = eligibleWorkers.map((w: any) => w.id)
      const companyDeptIds = (deptData ?? []).map((d: any) => d.id)
      if (workerIds.length > 0 && companyDeptIds.length > 0) {
        const { data: deptRestrictions } = await supabase
          .from('shift_worker_departments')
          .select('worker_id, department_id')
          .in('worker_id', workerIds)
          .in('department_id', companyDeptIds)

        const restrictedWorkerIds = new Set((deptRestrictions ?? []).map((r: any) => r.worker_id))
        const eligibilityMap: Record<string, string[] | null> = {}
        workerIds.forEach((id: string) => {
          if (restrictedWorkerIds.has(id)) {
            eligibilityMap[id] = (deptRestrictions ?? [])
              .filter((r: any) => r.worker_id === id)
              .map((r: any) => r.department_id)
          } else {
            eligibilityMap[id] = null
          }
        })
        setWorkerDeptEligibility(eligibilityMap)
      } else {
        setWorkerDeptEligibility({})
      }

      setLoading(false)
    }
    load()
  }, [companyId])

  const loadRangeData = useCallback(async () => {
    if (!company) return
    const deptIds = departments.map(d => d.id)

    // Rozšířený rozsah (+-1 den) napříč VŠEMI firmami - kvůli kontrole zákonné pauzy na hranicích měsíce
    const extStartDate = new Date(days[0]); extStartDate.setDate(extStartDate.getDate() - 1)
    const extEndDate = new Date(days[days.length - 1]); extEndDate.setDate(extEndDate.getDate() + 1)
    const extRangeStart = formatDate(extStartDate)
    const extRangeEnd = formatDate(extEndDate)

    const [{ data: reqData }, { data: allAssignments }, { data: extAssignments }] = await Promise.all([
      deptIds.length > 0
        ? supabase.from('shift_requirements').select('department_id, date, shift_type, required_count').in('department_id', deptIds).gte('date', rangeStart).lte('date', rangeEnd)
        : Promise.resolve({ data: [] }),
      supabase.from('shift_assignments').select('id, worker_id, department_id, date, shift_type, confirmed, shift_departments(company_id)').gte('date', rangeStart).lte('date', rangeEnd),
      supabase.from('shift_assignments').select('worker_id, date, shift_type, department_id').gte('date', extRangeStart).lte('date', extRangeEnd),
    ])

    setRequirements(reqData ?? [])
    setDataVersion(v => v + 1)
    setAssignments(
      (allAssignments ?? []).map((a: any) => ({
        id: a.id,
        worker_id: a.worker_id,
        department_id: a.department_id,
        date: a.date,
        shift_type: a.shift_type,
        company_id: a.shift_departments?.company_id ?? '',
        confirmed: a.confirmed ?? false,
      }))
    )

    // Dopočítat časové intervaly směn napříč firmami pro kontrolu zákonné pauzy
    const extDeptIds = [...new Set((extAssignments ?? []).map((a: any) => a.department_id))]
    let deptTimesMap: Record<string, ShiftTimes> = {}
    if (extDeptIds.length > 0) {
      const { data: deptTimesData } = await supabase
        .from('shift_departments')
        .select('id, shift_times, shift_companies(shift_times)')
        .in('id', extDeptIds)
      ;(deptTimesData ?? []).forEach((d: any) => {
        deptTimesMap[d.id] = d.shift_times ?? d.shift_companies?.shift_times ?? {}
      })
    }

    const intervals: Record<string, WorkerInterval[]> = {}
    ;(extAssignments ?? []).forEach((a: any) => {
      const times = deptTimesMap[a.department_id]
      const interval = computeInterval(a.date, a.shift_type, times)
      if (!interval) return
      if (!intervals[a.worker_id]) intervals[a.worker_id] = []
      intervals[a.worker_id].push({ date: a.date, shift_type: a.shift_type, start: interval.start, end: interval.end })
    })
    setWorkerIntervals(intervals)
  }, [company, departments, rangeStart, rangeEnd])

  useEffect(() => {
    loadRangeData()
  }, [loadRangeData])

  const effectiveShiftTypes = (dept: Department) => dept.shift_types ?? shiftTypes
  const effectiveShiftTimes = (dept: Department): ShiftTimes => (dept as any).shift_times ?? (company as any)?.shift_times ?? {}

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

  // Zjistí, jestli by přiřazení pracovníka do daného provozu na (date, shiftType)
  // porušilo zákonnou pauzu vůči jeho ostatním směnám (napříč firmami)
  const isRestViolation = (workerId: string, date: string, shiftType: string, deptId: string): boolean => {
    const dept = departments.find(d => d.id === deptId)
    if (!dept) return false
    const candidate = computeInterval(date, shiftType, effectiveShiftTimes(dept))
    if (!candidate) return false
    const intervals = (workerIntervals[workerId] ?? []).filter(iv => !(iv.date === date && iv.shift_type === shiftType))
    for (const iv of intervals) {
      if (candidate.start < iv.end && iv.start < candidate.end) return true // překryv
      if (candidate.start >= iv.end) {
        const restHours = (candidate.start.getTime() - iv.end.getTime()) / 3600000
        if (restHours < MIN_REST_HOURS) return true
      }
      if (iv.start >= candidate.end) {
        const restHours = (iv.start.getTime() - candidate.end.getTime()) / 3600000
        if (restHours < MIN_REST_HOURS) return true
      }
    }
    return false
  }

  const selectDeptForWorkerCell = async (workerId: string, date: string, shiftType: string, deptId: string) => {
    const existing = getWorkerAssignment(workerId, date, shiftType)

    if (!deptId) {
      if (existing) await supabase.from('shift_assignments').delete().eq('id', existing.id)
      loadRangeData()
      return
    }

    if (existing) {
      if (existing.department_id === deptId) return
      const { error } = await supabase.from('shift_assignments').update({ department_id: deptId, confirmed: false, confirmed_at: null, hours: null }).eq('id', existing.id)
      if (error) alert('Chyba: ' + error.message)
    } else {
      const { error } = await supabase.from('shift_assignments').insert({
        department_id: deptId, worker_id: workerId, date, shift_type: shiftType,
      })
      if (error) alert(error.code === '23505' ? 'Tento pracovník je na danou směnu už přiřazen jinde.' : 'Chyba: ' + error.message)
    }
    loadRangeData()
  }

  const confirmAll = async () => {
    const toConfirm = assignments.filter(a => a.company_id === companyId && !a.confirmed)
    if (toConfirm.length === 0) {
      alert('Vše je již potvrzeno, nebo nejsou žádná přiřazení k potvrzení.')
      return
    }
    if (!confirm(`Potvrdit ${toConfirm.length} nepotvrzených směn a zapsat odpracované hodiny do karet pracovníků?`)) return

    setConfirming(true)
    const nowIso = new Date().toISOString()

    function calcHours(start?: string, end?: string): number {
      if (!start || !end) return 0
      const [sh, sm] = start.split(':').map(Number)
      const [eh, em] = end.split(':').map(Number)
      let diff = (eh * 60 + em) - (sh * 60 + sm)
      if (diff <= 0) diff += 24 * 60
      return Math.round((diff / 60) * 100) / 100
    }

    await Promise.all(toConfirm.map(a => {
      const dept = departments.find(d => d.id === a.department_id)
      const times = dept ? effectiveShiftTimes(dept)[a.shift_type] : undefined
      const hours = calcHours(times?.start, times?.end)
      return supabase.from('shift_assignments').update({ confirmed: true, confirmed_at: nowIso, hours }).eq('id', a.id)
    }))

    setConfirming(false)
    loadRangeData()
  }

  const goToPrevMonth = () => { const d = new Date(anchorMonth); d.setMonth(d.getMonth() - 1); setAnchorMonth(d) }
  const goToNextMonth = () => { const d = new Date(anchorMonth); d.setMonth(d.getMonth() + 1); setAnchorMonth(d) }

  // Průběžně hlásit rodičovské komponentě aktuální zobrazenou pozici (i bez navigace tlačítky)
  useEffect(() => {
    onDateChange?.(anchorMonth)
  }, [anchorMonth])

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>
  if (!company) return <div className="text-sm text-gray-400">Firma nenalezena</div>

  const unconfirmedCount = assignments.filter(a => a.company_id === companyId && !a.confirmed).length

  return (
    <div>
      <style jsx>{`
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <button
          onClick={confirmAll}
          disabled={confirming}
          className="text-xs px-3 py-1.5 rounded-lg text-white font-medium disabled:opacity-60"
          style={{ background: '#2a4f2d' }}
        >
          {confirming ? 'Potvrzuji...' : `Potvrdit${unconfirmedCount > 0 ? ` (${unconfirmedCount})` : ''}`}
        </button>
        <div className="flex items-center gap-2">
          <button onClick={goToPrevMonth} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">← Předchozí</button>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap" style={{ minWidth: '140px', textAlign: 'center' }}>
            {MONTH_NAMES[anchorMonth.getMonth()]} {anchorMonth.getFullYear()}
          </span>
          <button onClick={goToNextMonth} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">Další →</button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Potvrzením se pro nepotvrzené směny spočítají a zapíší odpracované hodiny na kartu pracovníka. Pokud po potvrzení směnu změníte, je potřeba potvrdit znovu.
        <br />
        <span style={{ color: '#ef4444' }}>⚠ = porušená zákonná pauza {MIN_REST_HOURS}h mezi směnami</span>
      </p>

      {departments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Nejdřív založte alespoň jeden provoz pro tuto firmu.</p>
        </div>
      ) : (
        <div ref={containerRef} className="bg-white rounded-xl border border-gray-100 p-2 overflow-x-auto w-full">
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="sticky left-0 bg-white z-20" style={{ minWidth: LABEL_WIDTH, width: LABEL_WIDTH }} rowSpan={2}></th>
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
              {departments.map((dept) => {
                const deptShifts = effectiveShiftTypes(dept)
                return (
                  <tr key={dept.id} className="border-b border-gray-50">
                    <td className="sticky left-0 bg-white z-10 px-2 py-1" style={{ minWidth: LABEL_WIDTH, width: LABEL_WIDTH }}>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full flex-shrink-0" style={{ width: '8px', height: '8px', background: dept.color }} />
                        <span className="text-xs font-medium truncate" style={{ color: '#1a1a1a' }} title={dept.name}>
                          {dept.name}{dept.abbreviation ? ` (${dept.abbreviation})` : ''}
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
                                key={`${dept.id}|${date}|${s}|${dataVersion}`}
                                type="number"
                                min={0}
                                defaultValue={getRequirement(dept.id, date, s)}
                                onBlur={(e) => updateRequirement(dept.id, date, s, parseInt(e.target.value) || 0)}
                                className="border-0 text-center bg-transparent"
                                style={{ width: cellWidth, fontSize: '10px', padding: '2px 0' }}
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

              {[
                { label: 'Potřeba', fn: getPotreba, style: { color: '#1a1a1a', fontWeight: 600 } },
                { label: 'Mám',     fn: getMam,     style: { color: '#2a4f2d', fontWeight: 600 } },
                { label: 'Zbývá',   fn: (date: string, s: string) => getPotreba(date, s) - getMam(date, s), style: { fontWeight: 600 } },
              ].map(({ label, fn, style }) => (
                <tr key={label} style={{ background: '#f2f8f1' }} className="border-b border-gray-100">
                  <td className="sticky left-0 z-10 px-2 py-1 text-xs font-semibold" style={{ minWidth: LABEL_WIDTH, width: LABEL_WIDTH, background: '#f2f8f1', color: '#1a1a1a' }}>
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

              {workers.map((worker) => (
                <tr key={worker.id} className="border-b border-gray-50">
                  <td className="sticky left-0 bg-white z-10 px-2 py-1" style={{ minWidth: LABEL_WIDTH, width: LABEL_WIDTH }}>
                    <span className="text-xs truncate" style={{ color: '#374151' }} title={worker.name}>{worker.name}</span>
                  </td>
                  {days.map((d) => {
                    const date = formatDate(d)
                    return shiftTypes.map((s, i) => {
                      const assignment = getWorkerAssignment(worker.id, date, s)
                      const isForeignCompany = assignment && assignment.company_id !== companyId
                      const allowedDepts = workerDeptEligibility[worker.id]
                      const options = departments.filter(dep => {
                        if (!effectiveShiftTypes(dep).includes(s)) return false
                        if (allowedDepts !== null && allowedDepts !== undefined && !allowedDepts.includes(dep.id)) return false
                        // Vždy nabídnout aktuálně vybraný provoz (i kdyby mezitím "zaplnil" kapacitu)
                        if (assignment?.department_id === dep.id) return true
                        // Nabídnout jen provozy, které ještě mají volné místo (potřeba > už obsazeno)
                        const required = getRequirement(dep.id, date, s)
                        const assignedCount = assignments.filter(a => a.department_id === dep.id && a.date === date && a.shift_type === s).length
                        return assignedCount < required
                      })
                      const assignedDept = assignment ? departments.find(dep => dep.id === assignment.department_id) : null
                      const currentViolation = assignment ? isRestViolation(worker.id, date, s, assignment.department_id) : false
                      const optionsWithViolation = options.map(dep => ({ dep, violation: isRestViolation(worker.id, date, s, dep.id) }))
                      const sortedOptions = [
                        ...optionsWithViolation.filter(o => !o.violation),
                        ...optionsWithViolation.filter(o => o.violation),
                      ]

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
                              className="text-center"
                              style={{
                                width: cellWidth,
                                fontSize: '9px',
                                padding: '2px 0',
                                background: currentViolation ? '#fef2f2' : assignedDept ? assignedDept.color + '33' : 'transparent',
                                color: currentViolation ? '#ef4444' : assignedDept ? assignedDept.color : '#9ca3af',
                                fontWeight: assignedDept ? 600 : 400,
                                border: currentViolation ? '1px solid #ef4444' : assignment?.confirmed ? '1px solid #2a4f2d' : '1px solid transparent',
                                borderRadius: '3px',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                textAlign: 'center',
                                textAlignLast: 'center',
                              }}
                              title={currentViolation ? `Pozor: porušena zákonná pauza ${MIN_REST_HOURS}h mezi směnami` : assignment?.confirmed ? 'Potvrzeno' : undefined}
                            >
                              <option value="">–</option>
                              {sortedOptions.map(({ dep, violation }) => (
                                <option key={dep.id} value={dep.id} style={{ color: violation ? '#ef4444' : 'inherit' }}>
                                  {violation ? '⚠ ' : ''}{dep.abbreviation || dep.name}
                                </option>
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

          <div className="flex flex-wrap gap-3 mt-4 px-2 pb-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded" style={{ width: '10px', height: '10px', border: '1px solid #2a4f2d' }} />
              <span className="text-xs text-gray-500">= potvrzeno</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
