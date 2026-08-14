'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
]

interface Company {
  id: string
  name: string
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function EditShiftWorkerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [active, setActive] = useState(true)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])

  // Odpracované hodiny
  const [hoursMonth, setHoursMonth] = useState<Date>(() => { const d = new Date(); d.setDate(1); return d })
  const [monthlyHours, setMonthlyHours] = useState<{ companyName: string; hours: number }[]>([])
  const [totalHours, setTotalHours] = useState(0)
  const [hoursLoading, setHoursLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: worker }, { data: allCompanies }, { data: links }] = await Promise.all([
        supabase.from('shift_workers').select('*').eq('id', params.id).single(),
        supabase.from('shift_companies').select('id, name').eq('active', true).order('name'),
        supabase.from('shift_worker_companies').select('company_id').eq('worker_id', params.id),
      ])

      if (worker) {
        setName(worker.name)
        setNote(worker.note ?? '')
        setActive(worker.active)
      }
      setCompanies(allCompanies ?? [])
      setSelectedCompanies((links ?? []).map(l => l.company_id))
      setLoading(false)
    }
    load()
  }, [params.id])

  const loadHours = useCallback(async () => {
    setHoursLoading(true)
    const year = hoursMonth.getFullYear()
    const month = hoursMonth.getMonth()
    const rangeStart = formatDate(new Date(year, month, 1))
    const rangeEnd = formatDate(new Date(year, month + 1, 0))

    const { data } = await supabase
      .from('shift_assignments')
      .select('hours, shift_departments(shift_companies(id, name))')
      .eq('worker_id', params.id)
      .eq('confirmed', true)
      .gte('date', rangeStart)
      .lte('date', rangeEnd)

    const byCompany: Record<string, { companyName: string; hours: number }> = {}
    let total = 0
    ;(data ?? []).forEach((row: any) => {
      const company = row.shift_departments?.shift_companies
      const hours = row.hours ?? 0
      total += hours
      if (company) {
        if (!byCompany[company.id]) byCompany[company.id] = { companyName: company.name, hours: 0 }
        byCompany[company.id].hours += hours
      }
    })

    setMonthlyHours(Object.values(byCompany))
    setTotalHours(Math.round(total * 100) / 100)
    setHoursLoading(false)
  }, [params.id, hoursMonth])

  useEffect(() => {
    loadHours()
  }, [loadHours])

  const toggleCompany = (id: string) => {
    setSelectedCompanies(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('shift_workers').update({
      name,
      note: note || null,
      active,
    }).eq('id', params.id)

    if (error) {
      alert('Chyba při ukládání: ' + error.message)
      setSaving(false)
      return
    }

    await supabase.from('shift_worker_companies').delete().eq('worker_id', params.id)
    if (selectedCompanies.length > 0) {
      const rows = selectedCompanies.map(company_id => ({ worker_id: params.id, company_id }))
      const { error: linkError } = await supabase.from('shift_worker_companies').insert(rows)
      if (linkError) {
        alert('Pracovník uložen, ale nepodařilo se aktualizovat firmy: ' + linkError.message)
      }
    }

    router.push('/admin/shifts/workers')
  }

  const goToPrevMonth = () => { const d = new Date(hoursMonth); d.setMonth(d.getMonth() - 1); setHoursMonth(d) }
  const goToNextMonth = () => { const d = new Date(hoursMonth); d.setMonth(d.getMonth() + 1); setHoursMonth(d) }

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Zpět</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Upravit pracovníka</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="mb-4">
            <label className="form-label">Jméno *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" required />
          </div>
          <div>
            <label className="form-label">Poznámka</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="form-input min-h-[70px] resize-none" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="form-label mb-2 block">Smí pracovat ve firmách</label>
          {companies.length === 0 ? (
            <p className="text-xs text-gray-400">Zatím nejsou žádné aktivní firmy.</p>
          ) : (
            <div className="space-y-2">
              {companies.map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(c.id)}
                    onChange={() => toggleCompany(c.id)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#2a4f2d' }}
                  />
                  <span className="text-sm text-gray-700">{c.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-green-700" />
            <span className="text-sm text-gray-600">Aktivní</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: '#2a4f2d' }}>
            {saving ? 'Ukládám...' : 'Uložit změny'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
            Zrušit
          </button>
        </div>
      </form>

      {/* Odpracované hodiny */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium" style={{ color: '#1a1a1a' }}>Odpracované hodiny (potvrzené)</h2>
          <div className="flex items-center gap-2">
            <button onClick={goToPrevMonth} className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">←</button>
            <span className="text-xs text-gray-600" style={{ minWidth: '100px', textAlign: 'center' }}>
              {MONTH_NAMES[hoursMonth.getMonth()]} {hoursMonth.getFullYear()}
            </span>
            <button onClick={goToNextMonth} className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">→</button>
          </div>
        </div>

        {hoursLoading ? (
          <p className="text-xs text-gray-400">Načítám...</p>
        ) : (
          <>
            <div className="text-2xl font-medium mb-3" style={{ color: '#2a4f2d' }}>
              {totalHours} h <span className="text-sm text-gray-400 font-normal">celkem</span>
            </div>
            {monthlyHours.length > 0 && (
              <div className="space-y-1.5">
                {monthlyHours.map((c) => (
                  <div key={c.companyName} className="flex items-center justify-between text-xs text-gray-500">
                    <span>{c.companyName}</span>
                    <span className="font-medium" style={{ color: '#1a1a1a' }}>{c.hours} h</span>
                  </div>
                ))}
              </div>
            )}
            {monthlyHours.length === 0 && (
              <p className="text-xs text-gray-400">Žádné potvrzené směny v tomto měsíci.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
