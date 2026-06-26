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

export default function ApplicantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [applicant, setApplicant] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('applicants')
      .select('*, job:jobs(title_cs, title_de, location)')
      .eq('id', params.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setApplicant(data)
          setNotes(data.notes ?? '')
        }
      })
  }, [params.id])

  const updateStatus = async (status: string) => {
    await supabase.from('applicants').update({ status }).eq('id', params.id)
    setApplicant((prev: any) => ({ ...prev, status }))
  }

  const saveNotes = async () => {
    setSaving(true)
    await supabase.from('applicants').update({ notes }).eq('id', params.id)
    setSaving(false)
  }

  if (!applicant) return <div className="text-sm text-gray-400">Načítám...</div>

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Zpět</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>
          {applicant.first_name} {applicant.last_name}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Kontaktní údaje */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Kontakt</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✉️ <a href={`mailto:${applicant.email}`} className="hover:underline">{applicant.email}</a></p>
            {applicant.phone && <p>📞 <a href={`tel:${applicant.phone}`} className="hover:underline">{applicant.phone}</a></p>}
            <p className="text-xs text-gray-400 pt-2">
              Přijato: {new Date(applicant.created_at).toLocaleDateString('cs-CZ')}
            </p>
          </div>
        </div>

        {/* Pozice */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Pozice</h2>
          <p className="text-sm font-medium text-gray-700">{applicant.job?.title_cs ?? '–'}</p>
          <p className="text-xs text-gray-400 mt-1">{applicant.job?.location}</p>
        </div>
      </div>

      {/* Zpráva */}
      {applicant.message && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-medium mb-3" style={{ color: '#1a1a1a' }}>Zpráva od žadatele</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{applicant.message}</p>
        </div>
      )}

      {/* CV */}
      {applicant.cv_url && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-medium mb-3" style={{ color: '#1a1a1a' }}>Životopis</h2>
          <a
            href={applicant.cv_url}
            target="_blank"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: '#2a4f2d' }}
          >
            📄 Stáhnout CV
          </a>
        </div>
      )}

      {/* Stav */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Stav žádosti</h2>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateStatus(value)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
              style={{
                background: applicant.status === value ? '#2a4f2d' : 'transparent',
                color: applicant.status === value ? '#fff' : '#6b7280',
                borderColor: applicant.status === value ? '#2a4f2d' : '#e5e7eb',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Poznámky */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-medium mb-3" style={{ color: '#1a1a1a' }}>Interní poznámky</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="form-input mb-3"
          rows={4}
          placeholder="Interní poznámky vidí pouze admini..."
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
