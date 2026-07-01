'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const t = {
  cs: {
    back: '← Zpět',
    loading: 'Načítám...',
    notFound: 'Dotazník nenalezen',
    save: 'Uložit změny',
    saving: 'Ukládám...',
    status: 'Stav',
    notes: 'Interní poznámky',
    notesPlaceholder: 'Poznámky viditelné pouze v administraci...',
    personal: 'Osobní údaje',
    contact: 'Kontakt',
    work: 'Pracovní preference',
    education: 'Vzdělání',
    experience: 'Pracovní zkušenosti',
    message: 'Zpráva',
    statuses: {
      new: 'Nový', reviewing: 'Probíhá', invited: 'Pozván', rejected: 'Zamítnut', hired: 'Přijat',
    },
    fields: {
      firstName: 'Jméno', lastName: 'Příjmení', phone: 'Telefon', email: 'E-mail',
      street: 'Ulice', city: 'Město', birthDate: 'Datum narození', nationality: 'Národnost',
      maritalStatus: 'Rodinný stav', german: 'Němčina', drivingLicense: 'Řidičský průkaz',
      vzvLicense: 'Průkaz VZV', hasCar: 'Automobil', startDate: 'Nástup', workType: 'Typ práce',
      profese: 'Hledané profese', primarySchool: 'Základní škola', education: 'Vzdělání',
      educationDetail: 'Škola / Obor', job1: 'Poslední zaměstnání', job2: 'Předposlední',
      job3: '2. předposlední',
    },
  },
  de: {
    back: '← Zurück',
    loading: 'Laden...',
    notFound: 'Fragebogen nicht gefunden',
    save: 'Änderungen speichern',
    saving: 'Speichere...',
    status: 'Status',
    notes: 'Interne Notizen',
    notesPlaceholder: 'Notizen nur in der Verwaltung sichtbar...',
    personal: 'Persönliche Daten',
    contact: 'Kontakt',
    work: 'Arbeitspräferenzen',
    education: 'Bildung',
    experience: 'Berufserfahrung',
    message: 'Nachricht',
    statuses: {
      new: 'Neu', reviewing: 'In Bearbeitung', invited: 'Eingeladen', rejected: 'Abgelehnt', hired: 'Eingestellt',
    },
    fields: {
      firstName: 'Vorname', lastName: 'Nachname', phone: 'Telefon', email: 'E-Mail',
      street: 'Straße', city: 'Stadt', birthDate: 'Geburtsdatum', nationality: 'Staatsangehörigkeit',
      maritalStatus: 'Familienstand', german: 'Deutschkenntnisse', drivingLicense: 'Führerschein',
      vzvLicense: 'Gabelstapler-Schein', hasCar: 'Fahrzeug', startDate: 'Arbeitsbeginn', workType: 'Arbeitsart',
      profese: 'Gesuchte Berufe', primarySchool: 'Grundschule', education: 'Bildung',
      educationDetail: 'Schule / Fachrichtung', job1: 'Letzter Arbeitgeber', job2: 'Vorletzter',
      job3: '2. Vorletzter',
    },
  },
}

export default function QuestionnaireDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [status, setStatus] = useState('new')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<'cs' | 'de'>('cs')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const userLang = user?.user_metadata?.lang ?? 'cs'
      setLang(userLang as 'cs' | 'de')
    })
    supabase.from('questionnaires').select('*').eq('id', params.id).single().then(({ data: d }) => {
      if (d) {
        setData(d)
        setStatus(d.status ?? 'new')
        setNotes(d.notes ?? '')
      }
      setLoading(false)
    })
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('questionnaires').update({ status, notes }).eq('id', params.id)
    setSaving(false)
  }

  const tr = t[lang]

  if (loading) return <div className="text-sm text-gray-400">{tr.loading}</div>
  if (!data) return <div className="text-sm text-gray-400">{tr.notFound}</div>

  const statusColors: Record<string, { bg: string; color: string }> = {
    new:       { bg: '#eff6ff', color: '#3b82f6' },
    reviewing: { bg: '#fef3e6', color: '#e07b0a' },
    invited:   { bg: '#eaf3e8', color: '#2a4f2d' },
    rejected:  { bg: '#fef2f2', color: '#ef4444' },
    hired:     { bg: '#2a4f2d', color: '#fff' },
  }

  const field = (label: string, value: string | null | undefined) => value ? (
    <div className="mb-3">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-gray-700">{value}</div>
    </div>
  ) : null

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">{tr.back}</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>
          {data.first_name} {data.last_name}
        </h1>
      </div>

      <div className="space-y-4">

        {/* Stav + poznámky */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">{tr.status}</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input">
                {Object.entries(tr.statuses).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <span className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: statusColors[status]?.bg, color: statusColors[status]?.color }}>
                {tr.statuses[status as keyof typeof tr.statuses]}
              </span>
            </div>
          </div>
          <div>
            <label className="form-label">{tr.notes}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input min-h-[80px] resize-none" placeholder={tr.notesPlaceholder} />
          </div>
          <button onClick={handleSave} disabled={saving} className="mt-3 px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: '#2a4f2d' }}>
            {saving ? tr.saving : tr.save}
          </button>
        </div>

        {/* Osobní */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>{tr.personal}</h2>
          <div className="grid grid-cols-2 gap-x-6">
            {field(tr.fields.firstName, data.first_name)}
            {field(tr.fields.lastName, data.last_name)}
            {field(tr.fields.birthDate, data.birth_date)}
            {field(tr.fields.nationality, data.nationality)}
            {field(tr.fields.maritalStatus, data.marital_status)}
          </div>
        </div>

        {/* Kontakt */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>{tr.contact}</h2>
          <div className="grid grid-cols-2 gap-x-6">
            {field(tr.fields.email, data.email)}
            {field(tr.fields.phone, data.phone)}
            {field(tr.fields.street, data.street)}
            {field(tr.fields.city, data.city)}
          </div>
        </div>

        {/* Pracovní preference */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>{tr.work}</h2>
          <div className="grid grid-cols-2 gap-x-6">
            {field(tr.fields.profese, [data.profese, data.profese_jina].filter(Boolean).join(', '))}
            {field(tr.fields.startDate, data.start_date)}
            {field(tr.fields.german, data.german)}
            {field(tr.fields.workType, data.work_type)}
            {field(tr.fields.drivingLicense, data.driving_license)}
            {field(tr.fields.vzvLicense, data.vzv_license)}
            {field(tr.fields.hasCar, data.has_car)}
          </div>
        </div>

        {/* Vzdělání */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>{tr.education}</h2>
          <div className="grid grid-cols-2 gap-x-6">
            {field(tr.fields.primarySchool, data.primary_school)}
            {field(tr.fields.education, data.education)}
            {field(tr.fields.educationDetail, data.education_detail)}
          </div>
        </div>

        {/* Zkušenosti */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>{tr.experience}</h2>
          {field(tr.fields.job1, data.job1)}
          {field(tr.fields.job2, data.job2)}
          {field(tr.fields.job3, data.job3)}
        </div>

        {/* Zpráva */}
        {data.message && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-medium mb-3" style={{ color: '#1a1a1a' }}>{tr.message}</h2>
            <p className="text-sm text-gray-600">{data.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
