'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ANSPRECHPARTNER: Record<string, { name: string; telefon: string }> = {
  wagner: { name: 'Tobias Wagner', telefon: '+49 1516 1579946' },
  simsa: { name: 'Jaroslav Simsa', telefon: '+49 160 4097187' },
}

const MARITAL_STATUS_DE: Record<string, string> = {
  svobodny: 'ledig',
  zenaty: 'verheiratet',
  rozvedeny: 'geschieden',
}

const GERMAN_LEVEL_DE: Record<string, string> = {
  zadna: 'keine',
  zakladni: 'Grundkenntnisse',
  pokrocila: 'fortgeschritten',
  plynula: 'fließend',
}

// Nejčastější národnosti uchazečů - zbytek zůstává tak, jak to uchazeč napsal
const NATIONALITY_DE: Record<string, string> = {
  'česká': 'Tschechisch',
  'ceska': 'Tschechisch',
  'čr': 'Tschechisch',
  'czech': 'Tschechisch',
  'slovenská': 'Slowakisch',
  'slovenska': 'Slowakisch',
  'sk': 'Slowakisch',
  'polská': 'Polnisch',
  'polska': 'Polnisch',
  'ukrajinská': 'Ukrainisch',
  'ukrajinska': 'Ukrainisch',
  'německá': 'Deutsch',
  'nemecka': 'Deutsch',
  'maďarská': 'Ungarisch',
  'madarska': 'Ungarisch',
  'rumunská': 'Rumänisch',
  'rumunska': 'Rumänisch',
  'bulharská': 'Bulgarisch',
  'bulharska': 'Bulgarisch',
}

function translateNationality(value: string | null | undefined): string {
  if (!value) return ''
  const key = value.trim().toLowerCase()
  return NATIONALITY_DE[key] ?? value
}

function buildMobilitaet(drivingLicense: string | null, hasCar: string | null, vzv: string | null) {
  let base: string
  if (drivingLicense === 'ano' && hasCar === 'ano') base = 'Führerschein Klasse B + eigener PKW'
  else if (drivingLicense === 'ano') base = 'Führerschein Klasse B'
  else if (hasCar === 'ano') base = 'Eigener PKW (ohne Führerschein)'
  else base = 'Kein Führerschein, kein PKW'
  if (vzv === 'ano') base += ' + Staplerschein'
  return base
}

const emptyForm = {
  bewerbung_als: '',
  ansprechpartner_key: 'wagner',
  eintritt: '',
  mobilitaet: '',
  sprachen: '',
  nachname: '',
  vorname: '',
  geburtsdatum: '',
  plz_ort: '',
  nationalitaet: '',
  familienstand: '',
  schule_von_bis: '',
  schule_name: '',
  schule_abschluss: '',
  ausbildung_von_bis: '',
  ausbildung_firma: '',
  ausbildung_als: '',
  job1_von_bis: '',
  job1_firma: '',
  job1_taetigkeit: '',
  job2_von_bis: '',
  job2_firma: '',
  job2_taetigkeit: '',
  job3_von_bis: '',
  job3_firma: '',
  job3_taetigkeit: '',
}

export default function GenerateProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    supabase.from('questionnaires').select('*').eq('id', params.id).single().then(({ data: q }) => {
      if (q) {
        setForm({
          bewerbung_als: '',
          ansprechpartner_key: 'wagner',
          eintritt: q.start_date ?? '',
          mobilitaet: buildMobilitaet(q.driving_license, q.has_car, q.vzv_license),
          sprachen: `Deutsch: ${GERMAN_LEVEL_DE[q.german] ?? q.german ?? ''}`,
          nachname: q.last_name ?? '',
          vorname: q.first_name ?? '',
          geburtsdatum: q.birth_date ?? '',
          plz_ort: [q.zip, q.city].filter(Boolean).join(' '),
          nationalitaet: translateNationality(q.nationality),
          familienstand: MARITAL_STATUS_DE[q.marital_status] ?? q.marital_status ?? '',
          schule_von_bis: '',
          schule_name: q.primary_school ?? '',
          schule_abschluss: '',
          ausbildung_von_bis: '',
          ausbildung_firma: q.education_detail ?? '',
          ausbildung_als: '',
          job1_von_bis: '',
          job1_firma: q.job1 ?? '',
          job1_taetigkeit: '',
          job2_von_bis: '',
          job2_firma: q.job2 ?? '',
          job2_taetigkeit: '',
          job3_von_bis: '',
          job3_firma: q.job3 ?? '',
          job3_taetigkeit: '',
        })
      }
      setLoading(false)
    })
  }, [params.id])

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const contact = ANSPRECHPARTNER[form.ansprechpartner_key]
      const { ansprechpartner_key, ...rest } = form
      const fields = { ...rest, ansprechpartner: contact.name, telefon: contact.telefon }

      const res = await fetch('/api/admin/generate-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ fields }),
      })
      if (!res.ok) throw new Error('Chyba při generování')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Qualifikationsprofil_${form.nachname}_${form.vorname}.docx`.replace(/\s+/g, '_')
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Chyba při generování profilu')
    } finally {
      setGenerating(false)
    }
  }

  const field = (label: string, key: keyof typeof emptyForm, placeholder = '') => (
    <div>
      <label className="form-label">{label}</label>
      <input value={form[key]} onChange={set(key)} className="form-input" placeholder={placeholder} />
    </div>
  )

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Zpět</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Vygenerovat profil (Qualifikationsprofil)</h1>
      </div>
      <p className="text-xs text-gray-400 mb-6">
        Pole jsou předvyplněná z dotazníku a přeložená do němčiny, kde to šlo automaticky. Volný text (škola, zaměstnání) uprav ručně podle potřeby - nic tu není napevno.
      </p>

      <div className="space-y-4">

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Hlavička</h2>
          <div className="grid grid-cols-2 gap-4">
            {field('Bewerbung als', 'bewerbung_als', 'např. CNC-Bediener')}
            <div>
              <label className="form-label">Ihr Ansprechpartner</label>
              <select
                value={form.ansprechpartner_key}
                onChange={(e) => setForm(prev => ({ ...prev, ansprechpartner_key: e.target.value }))}
                className="form-input"
              >
                <option value="wagner">Tobias Wagner</option>
                <option value="simsa">Jaroslav Simsa</option>
              </select>
            </div>
            {field('Eintritt möglich ab', 'eintritt')}
            {field('Mobilität', 'mobilitaet')}
            {field('Sprachen', 'sprachen')}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Persönliche Daten</h2>
          <div className="grid grid-cols-2 gap-4">
            {field('Name', 'nachname')}
            {field('Vorname', 'vorname')}
            {field('Geburtsdatum', 'geburtsdatum')}
            {field('PLZ Ort', 'plz_ort')}
            {field('Staatsangehörigkeit', 'nationalitaet')}
            {field('Familienstand', 'familienstand')}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Schulausbildung</h2>
          <div className="grid grid-cols-3 gap-4">
            {field('von - bis', 'schule_von_bis')}
            {field('Schule', 'schule_name')}
            {field('Abschluss', 'schule_abschluss')}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Berufsausbildung / Weiterbildung</h2>
          <div className="grid grid-cols-3 gap-4">
            {field('von - bis', 'ausbildung_von_bis')}
            {field('Firma', 'ausbildung_firma')}
            {field('Ausbildung als', 'ausbildung_als')}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Berufstätigkeit</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {field('von - bis (1)', 'job1_von_bis')}
              {field('Firma (1)', 'job1_firma')}
              {field('Tätigkeit (1)', 'job1_taetigkeit')}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {field('von - bis (2)', 'job2_von_bis')}
              {field('Firma (2)', 'job2_firma')}
              {field('Tätigkeit (2)', 'job2_taetigkeit')}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {field('von - bis (3)', 'job3_von_bis')}
              {field('Firma (3)', 'job3_firma')}
              {field('Tätigkeit (3)', 'job3_taetigkeit')}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: '#2a4f2d' }}
          >
            {generating ? 'Generuji...' : 'Stáhnout dokument'}
          </button>
          <button onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
            Zrušit
          </button>
        </div>
      </div>
    </div>
  )
}
