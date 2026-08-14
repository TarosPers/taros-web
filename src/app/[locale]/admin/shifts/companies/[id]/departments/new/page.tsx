'use client'
import { useEffect, useState } from 'react'
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

const COLOR_PALETTE = [
  '#2a4f2d', '#e07b0a', '#3b82f6', '#e11d48',
  '#8b5cf6', '#059669', '#ca8a04', '#0891b2',
  '#db2777', '#65a30d',
]

type ShiftTimes = Record<string, { start: string; end: string }>

interface Company {
  id: string
  name: string
  shift_types: string[]
  shift_times: ShiftTimes
}

export default function NewShiftDepartmentPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<Company | null>(null)
  const [name, setName] = useState('')
  const [abbreviation, setAbbreviation] = useState('')
  const [color, setColor] = useState(COLOR_PALETTE[0])
  const [active, setActive] = useState(true)
  const [useCustom, setUseCustom] = useState(false)
  const [customShiftTypes, setCustomShiftTypes] = useState<string[]>([])
  const [customTimes, setCustomTimes] = useState<ShiftTimes>({})

  useEffect(() => {
    supabase.from('shift_companies').select('*').eq('id', params.id).single().then(({ data }) => {
      setCompany(data)
      setCustomShiftTypes(data?.shift_types ?? [])
      setCustomTimes(data?.shift_times ?? {})
      setLoading(false)
    })
  }, [params.id])

  const toggleShiftType = (value: string) => {
    setCustomShiftTypes(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value])
  }

  const updateTime = (shift: string, field: 'start' | 'end', value: string) => {
    setCustomTimes(prev => ({ ...prev, [shift]: { ...prev[shift], [field]: value } }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (useCustom && customShiftTypes.length === 0) {
      alert('Vyberte alespoň jednu směnu pro tento provoz')
      return
    }
    if (!abbreviation.trim()) {
      alert('Vyplňte zkratku provozu')
      return
    }
    setSaving(true)

    const relevantTimes: ShiftTimes = {}
    if (useCustom) {
      customShiftTypes.forEach(s => { relevantTimes[s] = customTimes[s] })
    }

    const { error } = await supabase.from('shift_departments').insert({
      company_id: params.id,
      name,
      abbreviation: abbreviation.trim(),
      color,
      active,
      shift_types: useCustom ? customShiftTypes : null,
      shift_times: useCustom ? relevantTimes : null,
    })

    if (error) {
      alert('Chyba při ukládání: ' + error.message)
      setSaving(false)
    } else {
      router.push(`/admin/shifts/companies/${params.id}/departments`)
    }
  }

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>
  if (!company) return <div className="text-sm text-gray-400">Firma nenalezena</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Zpět</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Nový provoz – {company.name}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Název provozu *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" required placeholder="Kommissionierung" />
            </div>
            <div>
              <label className="form-label">Zkratka *</label>
              <input
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                className="form-input"
                required
                maxLength={4}
                placeholder="KOM"
              />
              <p className="text-xs text-gray-400 mt-1">Krátký kód zobrazený v měsíční matici (max. 4 znaky)</p>
            </div>
          </div>

          <div>
            <label className="form-label mb-2 block">Barva</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="rounded-full transition-all"
                  style={{
                    width: '28px',
                    height: '28px',
                    background: c,
                    border: color === c ? '2px solid #1a1a1a' : '2px solid transparent',
                    boxShadow: color === c ? '0 0 0 2px #fff, 0 0 0 3px ' + c : 'none',
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: '#2a4f2d' }}
            />
            <span className="text-sm text-gray-700">Vlastní nastavení směn pro tento provoz</span>
          </label>
          <p className="text-xs text-gray-400 mb-3">
            {useCustom
              ? 'Tento provoz může používat jiné směny a/nebo jiné časy, než je výchozí nastavení firmy.'
              : `Bez zaškrtnutí se použijí výchozí směny a časy firmy (${company.shift_types.map(s => `${SHIFT_LABELS[s]} ${company.shift_times[s]?.start}–${company.shift_times[s]?.end}`).join(', ')}).`}
          </p>

          {useCustom && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              {company.shift_types.map((shift) => (
                <div key={shift} className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer" style={{ width: '120px' }}>
                    <input
                      type="checkbox"
                      checked={customShiftTypes.includes(shift)}
                      onChange={() => toggleShiftType(shift)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#2a4f2d' }}
                    />
                    <span className="text-sm text-gray-700">{SHIFT_LABELS[shift] ?? shift}</span>
                  </label>
                  {customShiftTypes.includes(shift) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <input
                        type="time"
                        value={customTimes[shift]?.start ?? ''}
                        onChange={(e) => updateTime(shift, 'start', e.target.value)}
                        className="form-input"
                        style={{ width: '110px', padding: '6px 8px' }}
                      />
                      <span>–</span>
                      <input
                        type="time"
                        value={customTimes[shift]?.end ?? ''}
                        onChange={(e) => updateTime(shift, 'end', e.target.value)}
                        className="form-input"
                        style={{ width: '110px', padding: '6px 8px' }}
                      />
                    </div>
                  )}
                </div>
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
            {saving ? 'Ukládám...' : 'Uložit provoz'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
            Zrušit
          </button>
        </div>
      </form>
    </div>
  )
}
