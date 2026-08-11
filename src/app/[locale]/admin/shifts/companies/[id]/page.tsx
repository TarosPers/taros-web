'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SHIFT_OPTIONS = [
  { value: 'morning',   labelCs: 'Ranní',     defaultStart: '06:00', defaultEnd: '14:00' },
  { value: 'afternoon', labelCs: 'Odpolední', defaultStart: '14:00', defaultEnd: '22:00' },
  { value: 'night',     labelCs: 'Noční',     defaultStart: '22:00', defaultEnd: '06:00' },
]

const DAY_OPTIONS = [
  { value: 1, labelCs: 'Po' },
  { value: 2, labelCs: 'Út' },
  { value: 3, labelCs: 'St' },
  { value: 4, labelCs: 'Čt' },
  { value: 5, labelCs: 'Pá' },
  { value: 6, labelCs: 'So' },
  { value: 7, labelCs: 'Ne' },
]

type ShiftTimes = Record<string, { start: string; end: string }>

export default function EditShiftCompanyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [active, setActive] = useState(true)
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [shiftTimes, setShiftTimes] = useState<ShiftTimes>({})

  useEffect(() => {
    supabase.from('shift_companies').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) {
        setName(data.name)
        setActive(data.active)
        setSelectedShifts(data.shift_types ?? [])
        setSelectedDays(data.working_days ?? [])

        const loadedTimes: ShiftTimes = {}
        SHIFT_OPTIONS.forEach(({ value, defaultStart, defaultEnd }) => {
          loadedTimes[value] = data.shift_times?.[value] ?? { start: defaultStart, end: defaultEnd }
        })
        setShiftTimes(loadedTimes)
      }
      setLoading(false)
    })
  }, [params.id])

  const toggleShift = (value: string) => {
    setSelectedShifts(prev => prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value])
  }

  const toggleDay = (value: number) => {
    setSelectedDays(prev => prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value])
  }

  const updateShiftTime = (shift: string, field: 'start' | 'end', value: string) => {
    setShiftTimes(prev => ({ ...prev, [shift]: { ...prev[shift], [field]: value } }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedShifts.length === 0) {
      alert('Vyberte alespoň jeden typ směny')
      return
    }
    if (selectedDays.length === 0) {
      alert('Vyberte alespoň jeden pracovní den')
      return
    }
    setSaving(true)

    const relevantShiftTimes: ShiftTimes = {}
    selectedShifts.forEach(s => { relevantShiftTimes[s] = shiftTimes[s] })

    const { error } = await supabase.from('shift_companies').update({
      name,
      shift_types: selectedShifts,
      working_days: selectedDays,
      shift_times: relevantShiftTimes,
      active,
    }).eq('id', params.id)

    if (error) {
      alert('Chyba při ukládání: ' + error.message)
      setSaving(false)
    } else {
      router.push('/admin/shifts/companies')
    }
  }

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Zpět</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Upravit firmu</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="mb-4">
            <label className="form-label">Název firmy *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label mb-2 block">Používané směny * (lze vybrat více)</label>
            <div className="space-y-3">
              {SHIFT_OPTIONS.map(({ value, labelCs }) => (
                <div key={value} className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer" style={{ width: '120px' }}>
                    <input
                      type="checkbox"
                      checked={selectedShifts.includes(value)}
                      onChange={() => toggleShift(value)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#2a4f2d' }}
                    />
                    <span className="text-sm text-gray-700">{labelCs}</span>
                  </label>
                  {selectedShifts.includes(value) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <input
                        type="time"
                        value={shiftTimes[value]?.start ?? ''}
                        onChange={(e) => updateShiftTime(value, 'start', e.target.value)}
                        className="form-input"
                        style={{ width: '110px', padding: '6px 8px' }}
                      />
                      <span>–</span>
                      <input
                        type="time"
                        value={shiftTimes[value]?.end ?? ''}
                        onChange={(e) => updateShiftTime(value, 'end', e.target.value)}
                        className="form-input"
                        style={{ width: '110px', padding: '6px 8px' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Časy se použijí pro kontrolu zákonné pauzy mezi směnami.</p>
          </div>

          <div>
            <label className="form-label mb-2 block">Pracovní dny * (lze vybrat více)</label>
            <div className="flex gap-3">
              {DAY_OPTIONS.map(({ value, labelCs }) => (
                <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(value)}
                    onChange={() => toggleDay(value)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#2a4f2d' }}
                  />
                  <span className="text-sm text-gray-700">{labelCs}</span>
                </label>
              ))}
            </div>
          </div>
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
    </div>
  )
}
