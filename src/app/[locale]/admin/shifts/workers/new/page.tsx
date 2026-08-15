'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Company {
  id: string
  name: string
}

interface WorkerOption {
  id: string
  name: string
}

export default function NewShiftWorkerPage() {
  const router = useRouter()
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
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [companionPriorities, setCompanionPriorities] = useState<Record<string, number>>({})

  useEffect(() => {
    supabase.from('shift_companies').select('id, name').eq('active', true).order('name').then(({ data }) => {
      setCompanies(data ?? [])
    })
    supabase.from('shift_workers').select('id, name').eq('active', true).order('name').then(({ data }) => {
      setAllWorkers(data ?? [])
    })
  }, [])

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

    const { data: worker, error } = await supabase.from('shift_workers').insert({
      name,
      note: note || null,
      active,
      has_driving_license: hasDrivingLicense,
      phone_call: phoneCall || null,
      phone_whatsapp: samePhone ? (phoneCall || null) : (phoneWhatsapp || null),
    }).select().single()

    if (error || !worker) {
      alert('Chyba při ukládání: ' + error?.message)
      setSaving(false)
      return
    }

    if (selectedCompanies.length > 0) {
      const rows = selectedCompanies.map(company_id => ({ worker_id: worker.id, company_id }))
      const { error: linkError } = await supabase.from('shift_worker_companies').insert(rows)
      if (linkError) alert('Pracovník uložen, ale nepodařilo se přiřadit firmy: ' + linkError.message)
    }

    const companionIds = Object.keys(companionPriorities)
    if (companionIds.length > 0) {
      const rows = companionIds.map(companion_worker_id => ({
        worker_id: worker.id,
        companion_worker_id,
        priority: companionPriorities[companion_worker_id],
      }))
      const { error: linkError } = await supabase.from('shift_worker_links').insert(rows)
      if (linkError) alert('Pracovník uložen, ale nepodařilo se uložit sociální vazby: ' + linkError.message)
    }

    router.push(`/admin/shifts/workers/${worker.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Zpět</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Nový pracovník</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="mb-4">
            <label className="form-label">Jméno *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" required placeholder="Jana Nováková" />
          </div>
          <div className="mb-4">
            <label className="form-label">Poznámka</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="form-input min-h-[70px] resize-none" placeholder="Interní poznámka..." />
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
            <p className="text-xs text-gray-400">Zatím nejsou žádné aktivní firmy. Nejdřív založte firmu v sekci Firmy.</p>
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
            {saving ? 'Ukládám...' : 'Uložit pracovníka'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
            Zrušit
          </button>
        </div>
      </form>
    </div>
  )
}
