'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATUS_OPTIONS = [
  { value: 'new',       label: 'Nový' },
  { value: 'reviewing', label: 'Probíhá' },
  { value: 'invited',   label: 'Pozván' },
  { value: 'rejected',  label: 'Zamítnut' },
  { value: 'hired',     label: 'Přijat' },
]

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="flex gap-4 py-2 border-b border-gray-50">
      <span className="text-xs text-gray-400 w-48 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  ) : null

export default function QuestionnaireDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [q, setQ] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('questionnaires').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) { setQ(data); setNotes(data.notes ?? '') }
    })
  }, [params.id])

  const updateStatus = async (status: string) => {
    await supabase.from('questionnaires').update({ status }).eq('id', params.id)
    setQ((prev: any) => ({ ...prev, status }))
  }

  const saveNotes = async () => {
    setSaving(true)
    await supabase.from('questionnaires').update({ notes }).eq('id', params.id)
    setSaving(false)
  }

  if (!q) return <div className="text-sm text-gray-400">Načítám...</div>

  const educationLabels: Record<string, string> = {
    zakladni: 'Základní', vyceni: 'Vyučení v oboru', stredni: 'Střední škola',
    vos: 'Vyšší odborná škola', vs: 'Vysoká škola',
  }
  const germanLabels: Record<string, string> = {
    zadna: 'Žádná', zakladni: 'Základní', pokrocila: 'Pokročilá', plynula: 'Plynulá',
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Zpět</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>
          {q.first_name} {q.last_name}
        </h1>
        <span className="text-xs text-gray-400">
          {new Date(q.created_at).toLocaleDateString('cs-CZ')}
        </span>
      </div>

      {/* Foto */}
      {q.foto_url && (
        <div className="mb-4">
          <img src={q.foto_url} alt="Foto" className="w-24 h-24 rounded-xl object-cover border border-gray-100" />
        </div>
      )}

      {/* Osobní údaje */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-medium mb-3" style={{ color: '#2a4f2d' }}>Osobní údaje</h2>
        <Row label="Jméno a příjmení" value={`${q.first_name} ${q.last_name}`} />
        <Row label="E-mail" value={q.email} />
        <Row label="Telefon" value={q.phone} />
        <Row label="Adresa" value={[q.street, q.zip, q.city].filter(Boolean).join(', ')} />
        <Row label="Datum narození" value={q.birth_date} />
        <Row label="Národnost" value={q.nationality} />
        <Row label="Rodinný stav" value={q.marital_status} />
      </div>

      {/* Profese */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-medium mb-3" style={{ color: '#2a4f2d' }}>Poptávané profese</h2>
        <Row label="Profese" value={q.profese} />
        <Row label="Jiná profese" value={q.profese_jina} />
      </div>

      {/* Pracovní podmínky */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-medium mb-3" style={{ color: '#2a4f2d' }}>Pracovní podmínky</h2>
        <Row label="Nástup" value={q.start_date} />
        <Row label="Němčina" value={germanLabels[q.german] ?? q.german} />
        <Row label="Typ práce" value={q.work_type === 'pendler' ? 'Pendler (denní dojíždění)' : 'S ubytováním'} />
        <Row label="Řidičský průkaz" value={q.driving_license === 'ano' ? 'Ano' : 'Ne'} />
        <Row label="Automobil" value={q.has_car === 'ano' ? 'Ano' : 'Ne'} />
      </div>

      {/* Vzdělání */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-medium mb-3" style={{ color: '#2a4f2d' }}>Vzdělání</h2>
        <Row label="Základní škola" value={q.primary_school} />
        <Row label="Nejvyšší vzdělání" value={educationLabels[q.education] ?? q.education} />
        <Row label="Škola" value={q.education_detail} />
      </div>

      {/* Praxe */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-medium mb-3" style={{ color: '#2a4f2d' }}>Pracovní zkušenosti</h2>
        <Row label="Poslední zaměstnání" value={q.job1} />
        <Row label="Předposlední zaměstnání" value={q.job2} />
        <Row label="2. předposlední zaměstnání" value={q.job3} />
      </div>

      {/* Zpráva + CV */}
      {(q.message || q.cv_url) && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-medium mb-3" style={{ color: '#2a4f2d' }}>Přílohy</h2>
          <Row label="Zpráva" value={q.message} />
          {q.cv_url && (
            <div className="flex gap-4 py-2">
              <span className="text-xs text-gray-400 w-48 flex-shrink-0">Životopis</span>
              <a href={q.cv_url} target="_blank" className="text-sm underline" style={{ color: '#2a4f2d' }}>
                📄 Stáhnout CV
              </a>
            </div>
          )}
        </div>
      )}

      {/* Stav */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-medium mb-4" style={{ color: '#2a4f2d' }}>Stav</h2>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateStatus(value)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
              style={{
                background: q.status === value ? '#2a4f2d' : 'transparent',
                color: q.status === value ? '#fff' : '#6b7280',
                borderColor: q.status === value ? '#2a4f2d' : '#e5e7eb',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Poznámky */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-medium mb-3" style={{ color: '#2a4f2d' }}>Interní poznámky</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="form-input mb-3"
          rows={4}
          placeholder="Interní poznámky..."
        />
        <button
          onClick={saveNotes}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-60"
          style={{ background: '#2a4f2d' }}
        >
          {saving ? 'Ukládám...' : 'Uložit poznámky'}
        </button>
      </div>
    </div>
  )
}
