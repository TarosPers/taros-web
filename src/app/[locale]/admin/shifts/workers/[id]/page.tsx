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

interface WorkerOption {
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
  const [allWorkers, setAllWorkers] = useState<WorkerOption[]>([])
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [active, setActive] = useState(true)
  const [hasDrivingLicense, setHasDrivingLicense] = useState(true)
  const [phoneCall, setPhoneCall] = useState('')
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('')
  const [samePhone, setSamePhone] = useState(true)
  const [weeklyDeclineLimit, setWeeklyDeclineLimit] = useState(999)
  const [defaultUnavailable, setDefaultUnavailable] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [companionPriorities, setCompanionPriorities] = useState<Record<string, number>>({})

  // Přístup pracovníka (portál)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [loginEmail, setLoginEmail] = useState<string | null>(null)
  const [newAccountEmail, setNewAccountEmail] = useState('')
  const [newAccountPassword, setNewAccountPassword] = useState('')
  const [creatingAccount, setCreatingAccount] = useState(false)

  const [hoursMonth, setHoursMonth] = useState<Date>(() => { const d = new Date(); d.setDate(1); return d })
  const [monthlyHours, setMonthlyHours] = useState<{ companyName: string; hours: number }[]>([])
  const [totalHours, setTotalHours] = useState(0)
  const [hoursLoading, setHoursLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: worker }, { data: allCompanies }, { data: links }, { data: workersList }, { data: companionLinks }] = await Promise.all([
        supabase.from('shift_workers').select('*').eq('id', params.id).single(),
        supabase.from('shift_companies').select('id, name').eq('active', true).order('name'),
        supabase.from('shift_worker_companies').select('company_id').eq('worker_id', params.id),
        supabase.from('shift_workers').select('id, name').eq('active', true).neq('id', params.id).order('name'),
        supabase.from('shift_worker_links').select('companion_worker_id, priority').eq('worker_id', params.id),
      ])

      if (worker) {
        setName(worker.name)
        setNote(worker.note ?? '')
        setActive(worker.active)
        setHasDrivingLicense(worker.has_driving_license ?? true)
        setPhoneCall(worker.phone_call ?? '')
        setPhoneWhatsapp(worker.phone_whatsapp ?? '')
        setSamePhone(!worker.phone_whatsapp || worker.phone_whatsapp === worker.phone_call)
        setWeeklyDeclineLimit(worker.weekly_decline_limit ?? 999)
        setDefaultUnavailable(worker.default_unavailable_shift_types ?? [])
        setAuthUserId(worker.auth_user_id ?? null)
        setLoginEmail(worker.login_email ?? null)
      }
      setCompanies(allCompanies ?? [])
      setSelectedCompanies((links ?? []).map(l => l.company_id))
      setAllWorkers(workersList ?? [])
      const priorities: Record<string, number> = {}
      ;(companionLinks ?? []).forEach((l: any) => { priorities[l.companion_worker_id] = l.priority ?? 3 })
      setCompanionPriorities(priorities)
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

  const toggleCompanion = (id: string) => {
    setCompanionPriorities(prev => {
      const next = { ...prev }
      if (id in next) {
        delete next[id]
      } else {
        next[id] = 3
      }
      return next
    })
  }

  const setCompanionPriority = (id: string, priority: number) => {
    setCompanionPriorities(prev => ({ ...prev, [id]: priority }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('shift_workers').update({
      name,
      note: note || null,
      active,
      has_driving_license: hasDrivingLicense,
      phone_call: phoneCall || null,
      phone_whatsapp: samePhone ? (phoneCall || null) : (phoneWhatsapp || null),
      weekly_decline_limit: weeklyDeclineLimit,
      default_unavailable_shift_types: defaultUnavailable,
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
      if (linkError) alert('Pracovník uložen, ale nepodařilo se aktualizovat firmy: ' + linkError.message)
    }

    await supabase.from('shift_worker_links').delete().eq('worker_id', params.id)
    const companionIds = Object.keys(companionPriorities)
    if (companionIds.length > 0) {
      const rows = companionIds.map(companion_worker_id => ({
        worker_id: params.id,
        companion_worker_id,
        priority: companionPriorities[companion_worker_id],
      }))
      const { error: linkError } = await supabase.from('shift_worker_links').insert(rows)
      if (linkError) alert('Pracovník uložen, ale nepodařilo se aktualizovat sociální vazby: ' + linkError.message)
    }

    router.push('/admin/shifts/workers')
  }

  const handleCreateAccount = async () => {
    if (!newAccountEmail || !newAccountPassword) {
      alert('Vyplňte e-mail i heslo')
      return
    }
    setCreatingAccount(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/create-worker-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ workerId: params.id, email: newAccountEmail, password: newAccountPassword }),
    })
    const result = await res.json()
    if (!res.ok) {
      alert('Chyba: ' + result.error)
    } else {
      setAuthUserId(result.userId)
      setLoginEmail(newAccountEmail)
      setNewAccountPassword('')
      alert('Přístup vytvořen. Sdělte pracovníkovi e-mail a heslo osobně.')
    }
    setCreatingAccount(false)
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
          <div className="mb-4">
            <label className="form-label">Poznámka</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="form-input min-h-[70px] resize-none" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasDrivingLicense}
              onChange={(e) => setHasDrivingLicense(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#2a4f2d' }}
            />
            <span className="text-sm text-gray-700">Má řidičský průkaz</span>
          </label>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="form-label mb-2 block">Telefon</label>
          <div className="mb-3">
            <label className="form-label text-xs">Na volání</label>
            <input value={phoneCall} onChange={(e) => setPhoneCall(e.target.value)} className="form-input" placeholder="+420 601 234 567" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={samePhone}
              onChange={(e) => setSamePhone(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#2a4f2d' }}
            />
            <span className="text-sm text-gray-700">Stejné číslo i na WhatsApp</span>
          </label>
          {!samePhone && (
            <div>
              <label className="form-label text-xs">Na WhatsApp</label>
              <input value={phoneWhatsapp} onChange={(e) => setPhoneWhatsapp(e.target.value)} className="form-input" placeholder="+420 601 234 567" />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="form-label mb-2 block">Dostupnost směn</label>
          <div className="mb-4">
            <label className="form-label text-xs">Trvale nepracuje na (nastaví admin, pracovník to nemůže sám změnit)</label>
            <div className="flex gap-4 mt-1">
              {[{ v: 'morning', l: 'Ranní' }, { v: 'afternoon', l: 'Odpolední' }, { v: 'night', l: 'Noční' }].map(({ v, l }) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultUnavailable.includes(v)}
                    onChange={() => setDefaultUnavailable(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#2a4f2d' }}
                  />
                  <span className="text-sm text-gray-700">{l}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label text-xs">Limit odmítnutí směn za týden (v portálu)</label>
            <input
              type="number"
              min={0}
              value={weeklyDeclineLimit}
              onChange={(e) => setWeeklyDeclineLimit(parseInt(e.target.value) || 0)}
              className="form-input"
              style={{ width: '100px' }}
            />
            <p className="text-xs text-gray-400 mt-1">Kolikrát týdně smí pracovník v portálu označit "nemohu".</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="form-label mb-2 block">Sociální vazby – jezdí společně s</label>
          <p className="text-xs text-gray-400 mb-3">
            Priorita 1 = nejvyšší (nejoblíbenější řidič / nejlepší přítel), 5 = nejnižší.
          </p>
          {allWorkers.length === 0 ? (
            <p className="text-xs text-gray-400">Zatím nejsou žádní další pracovníci.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allWorkers.map((w) => {
                const isSelected = w.id in companionPriorities
                return (
                  <div key={w.id} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCompanion(w.id)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#2a4f2d' }}
                      />
                      <span className="text-sm text-gray-700">{w.name}</span>
                    </label>
                    {isSelected && (
                      <select
                        value={companionPriorities[w.id]}
                        onChange={(e) => setCompanionPriority(w.id, parseInt(e.target.value))}
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                      >
                        {[1, 2, 3, 4, 5].map(p => (
                          <option key={p} value={p}>Priorita {p}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          )}
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

      {/* Přístup do portálu pro pracovníky */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
        <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Přístup do portálu pro pracovníky</h2>
        {authUserId ? (
          <div className="text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mb-2" style={{ background: '#eaf3e8', color: '#2a4f2d' }}>
              ✓ Přístup vytvořen
            </span>
            <p>Přihlašovací e-mail: <strong>{loginEmail}</strong></p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              Pracovník se bude moci přihlásit na portálu, zadávat svou dostupnost a vidět svůj rozvrh směn.
            </p>
            <div>
              <label className="form-label text-xs">E-mail</label>
              <input
                type="email"
                value={newAccountEmail}
                onChange={(e) => setNewAccountEmail(e.target.value)}
                className="form-input"
                placeholder="jana.novakova@example.com"
              />
            </div>
            <div>
              <label className="form-label text-xs">Počáteční heslo</label>
              <input
                type="text"
                value={newAccountPassword}
                onChange={(e) => setNewAccountPassword(e.target.value)}
                className="form-input"
                placeholder="alespoň 6 znaků"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateAccount}
              disabled={creatingAccount}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ background: '#2a4f2d' }}
            >
              {creatingAccount ? 'Vytvářím...' : 'Vytvořit přístup'}
            </button>
          </div>
        )}
      </div>

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
