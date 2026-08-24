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
const SHIFT_TYPES = ['morning', 'afternoon', 'night']
const DAY_LABELS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']

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
// Klíč týdne (pondělí dané date) - pro rozlišení limitu po týdnech
function weekKey(d: Date): string {
  return formatDate(getMonday(d))
}

interface Worker {
  id: string
  name: string
  weekly_decline_limit: number
  default_unavailable_shift_types: string[]
}

interface Assignment {
  id: string
  date: string
  shift_type: string
  department_name: string
  company_name: string
}

interface AvailabilityRow {
  id: string
  date: string
  shift_type: string
}

export default function PortalHomePage() {
  const [tab, setTab] = useState<'rozvrh' | 'dostupnost'>('rozvrh')
  const [loading, setLoading] = useState(true)
  const [worker, setWorker] = useState<Worker | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [availability, setAvailability] = useState<AvailabilityRow[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: workerData } = await supabase
        .from('shift_workers')
        .select('id, name, weekly_decline_limit, default_unavailable_shift_types')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!workerData) { setLoading(false); return }
      setWorker(workerData)

      const today = formatDate(new Date())
      const [{ data: assignData }, { data: availData }] = await Promise.all([
        supabase
          .from('shift_assignments')
          .select('id, date, shift_type, shift_departments(name, shift_companies(name))')
          .eq('worker_id', workerData.id)
          .gte('date', today)
          .order('date'),
        supabase
          .from('shift_worker_availability')
          .select('id, date, shift_type')
          .eq('worker_id', workerData.id),
      ])

      setAssignments(
        (assignData ?? []).map((a: any) => ({
          id: a.id,
          date: a.date,
          shift_type: a.shift_type,
          department_name: a.shift_departments?.name ?? '?',
          company_name: a.shift_departments?.shift_companies?.name ?? '?',
        }))
      )
      setAvailability(availData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const reloadAvailability = useCallback(async () => {
    if (!worker) return
    const { data } = await supabase.from('shift_worker_availability').select('id, date, shift_type').eq('worker_id', worker.id)
    setAvailability(data ?? [])
  }, [worker])

  const toggleAvailability = async (date: string, shiftType: string, weekCount: number, weekLimit: number) => {
    if (!worker) return
    const existing = availability.find(a => a.date === date && a.shift_type === shiftType)

    if (existing) {
      await supabase.from('shift_worker_availability').delete().eq('id', existing.id)
    } else {
      if (weekCount >= weekLimit) {
        alert(`Vyčerpali jste limit ${weekLimit} odmítnutí pro tento týden.`)
        return
      }
      await supabase.from('shift_worker_availability').insert({ worker_id: worker.id, date, shift_type: shiftType })
    }
    reloadAvailability()
  }

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>
  if (!worker) return <div className="text-sm text-gray-400">Profil pracovníka nenalezen.</div>

  // 2 týdny dopředu (aktuální + příští), pondělí-neděle
  const thisMonday = getMonday(new Date())
  const days: Date[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(thisMonday)
    d.setDate(d.getDate() + i)
    days.push(d)
  }

  // Počet ad-hoc (netrvalých) odmítnutí za týden
  const weekCounts: Record<string, number> = {}
  availability.forEach(a => {
    const wk = weekKey(new Date(a.date))
    weekCounts[wk] = (weekCounts[wk] ?? 0) + 1
  })

  const assignmentsByDate: Record<string, Assignment[]> = {}
  assignments.forEach(a => {
    if (!assignmentsByDate[a.date]) assignmentsByDate[a.date] = []
    assignmentsByDate[a.date].push(a)
  })

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 bg-white rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setTab('rozvrh')}
          className="text-sm px-4 py-2 rounded-md transition-colors"
          style={{ background: tab === 'rozvrh' ? '#2a4f2d' : 'transparent', color: tab === 'rozvrh' ? '#fff' : '#6b7280' }}
        >
          Můj rozvrh
        </button>
        <button
          onClick={() => setTab('dostupnost')}
          className="text-sm px-4 py-2 rounded-md transition-colors"
          style={{ background: tab === 'dostupnost' ? '#2a4f2d' : 'transparent', color: tab === 'dostupnost' ? '#fff' : '#6b7280' }}
        >
          Dostupnost
        </button>
      </div>

      {tab === 'rozvrh' && (
        <div className="space-y-2">
          {assignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
              Zatím nemáte naplánované žádné směny.
            </div>
          ) : (
            Object.entries(assignmentsByDate).map(([date, items]) => (
              <div key={date} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
                  {formatDayLabel(new Date(date))}
                </div>
                {items.map(a => (
                  <div key={a.id} className="text-xs text-gray-500 flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full font-medium" style={{ background: '#eaf3e8', color: '#2a4f2d' }}>
                      {SHIFT_LABELS[a.shift_type] ?? a.shift_type}
                    </span>
                    <span>{a.company_name} – {a.department_name}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'dostupnost' && (
        <div>
          <p className="text-xs text-gray-400 mb-4">
            Označte směny, na které nemůžete nastoupit. Trvale nedostupné směny (nastavené adminem) jsou vždy zaškrtnuté a nelze je změnit.
          </p>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Den</th>
                  {SHIFT_TYPES.map(s => (
                    <th key={s} className="text-center px-2 py-2 text-xs font-medium text-gray-400">{SHIFT_LABELS[s]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {days.map((d, idx) => {
                  const date = formatDate(d)
                  const wk = weekKey(d)
                  const weekCount = weekCounts[wk] ?? 0
                  const isNewWeek = idx === 0 || weekKey(days[idx - 1]) !== wk
                  return (
                    <tr key={date}>
                      <td className="px-4 py-2 text-xs" style={{ borderTop: isNewWeek && idx > 0 ? '2px solid #e5e7eb' : undefined }}>
                        <div style={{ color: '#1a1a1a' }}>{formatDayLabel(d)}</div>
                        {isNewWeek && (
                          <div className="text-gray-400 mt-0.5">
                            zbývá {Math.max(worker.weekly_decline_limit - weekCount, 0)}/{worker.weekly_decline_limit}
                          </div>
                        )}
                      </td>
                      {SHIFT_TYPES.map(shiftType => {
                        const isPermanent = worker.default_unavailable_shift_types.includes(shiftType)
                        const isMarked = availability.some(a => a.date === date && a.shift_type === shiftType)
                        const limitReached = weekCount >= worker.weekly_decline_limit
                        return (
                          <td key={shiftType} className="text-center px-2 py-2" style={{ borderTop: isNewWeek && idx > 0 ? '2px solid #e5e7eb' : undefined }}>
                            <input
                              type="checkbox"
                              checked={isPermanent || isMarked}
                              disabled={isPermanent || (!isMarked && limitReached)}
                              onChange={() => toggleAvailability(date, shiftType, weekCount, worker.weekly_decline_limit)}
                              className="w-4 h-4 rounded"
                              style={{ accentColor: isPermanent ? '#9ca3af' : '#ef4444' }}
                              title={isPermanent ? 'Trvale nedostupné (nastaveno adminem)' : undefined}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
