'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const t = {
  cs: {
    back: '← Zpět',
    title: 'Detail žadatele',
    save: 'Uložit změny',
    saving: 'Ukládám...',
    loading: 'Načítám...',
    notFound: 'Žadatel nenalezen',
    candidateProfile: 'Profil kandidáta',
    status: 'Stav',
    notes: 'Interní poznámky',
    notesPlaceholder: 'Poznámky viditelné pouze v administraci...',
    personalInfo: 'Osobní údaje',
    contact: 'Kontakt',
    address: 'Adresa',
    jobInfo: 'Pracovní informace',
    position: 'Pozice / Lokalita',
    cv: 'Životopis',
    download: 'Stáhnout',
    message: 'Zpráva uchazeče',
    statuses: {
      new: 'Nový', reviewing: 'Probíhá', invited: 'Pozván', rejected: 'Zamítnut', hired: 'Přijat', withdrew: 'Odstoupil',
    },
  },
  de: {
    back: '← Zurück',
    title: 'Bewerberdetails',
    save: 'Änderungen speichern',
    saving: 'Speichere...',
    loading: 'Laden...',
    notFound: 'Bewerber nicht gefunden',
    candidateProfile: 'Kandidatenprofil',
    status: 'Status',
    notes: 'Interne Notizen',
    notesPlaceholder: 'Notizen nur in der Verwaltung sichtbar...',
    personalInfo: 'Persönliche Daten',
    contact: 'Kontakt',
    address: 'Adresse',
    jobInfo: 'Arbeitsinformationen',
    position: 'Position / Standort',
    cv: 'Lebenslauf',
    download: 'Herunterladen',
    message: 'Nachricht des Bewerbers',
    statuses: {
      new: 'Neu', reviewing: 'In Bearbeitung', invited: 'Eingeladen', rejected: 'Abgelehnt', hired: 'Eingestellt', withdrew: 'Zurückgezogen',
    },
  },
}

export default function ApplicantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] ?? 'cs'
  const [applicant, setApplicant] = useState<any>(null)
  const [job, setJob] = useState<any>(null)
  const [status, setStatus] = useState('new')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<'cs' | 'de'>('cs')
  const [replyOpen, setReplyOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const userLang = user?.user_metadata?.lang ?? 'cs'
      setLang(userLang as 'cs' | 'de')
    })

    supabase.from('applicants').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) {
        setApplicant(data)
        setStatus(data.status ?? 'new')
        setNotes(data.notes ?? '')
        if (data.job_id) {
          supabase.from('jobs').select('*').eq('id', data.job_id).single().then(({ data: jobData }) => {
            setJob(jobData)
          })
        }
      }
      setLoading(false)
    })
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('applicants').update({ status, notes }).eq('id', params.id)
    setSaving(false)
  }

  const tr = t[lang]

  if (loading) return <div className="text-sm text-gray-400">{tr.loading}</div>
  if (!applicant) return <div className="text-sm text-gray-400">{tr.notFound}</div>

  const statusColors: Record<string, { bg: string; color: string }> = {
    new:       { bg: '#eff6ff', color: '#3b82f6' },
    reviewing: { bg: '#fef3e6', color: '#e07b0a' },
    invited:   { bg: '#eaf3e8', color: '#2a4f2d' },
    rejected:  { bg: '#fef2f2', color: '#ef4444' },
    hired:     { bg: '#2a4f2d', color: '#fff' },
    withdrew:  { bg: '#f3f4f6', color: '#6b7280' },
  }

  const field = (label: string, value: string | null | undefined) => value ? (
    <div className="mb-3">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-gray-700">{value}</div>
    </div>
  ) : null

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">{tr.back}</button>
          <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>
            {applicant.first_name} {applicant.last_name}
          </h1>
        </div>
        {applicant.email && (
          <a
            href={`/${locale}/admin/candidates/${encodeURIComponent(applicant.email)}`}
            className="text-xs px-3 py-1.5 rounded-lg border font-medium"
            style={{ borderColor: '#6366f1', color: '#6366f1', textDecoration: 'none' }}
          >
            👤 {tr.candidateProfile}
          </a>
        )}
      </div>

      <div className="space-y-4">
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
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input min-h-[80px] resize-none"
              placeholder={tr.notesPlaceholder}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-3 px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: '#2a4f2d' }}
          >
            {saving ? tr.saving : tr.save}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{tr.contact}</h2>
            {applicant.email && (
              <div className="relative">
                <button
                  onClick={() => setReplyOpen(o => !o)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors"
                  style={{ borderColor: '#e07b0a', color: '#e07b0a', background: 'transparent' }}
                >
                  ✉️ {lang === 'de' ? 'Antworten' : 'Odpovědět'} <span>▾</span>
                </button>
                {replyOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[260px]">
                    <a
                      href={`mailto:${applicant.email}?subject=${encodeURIComponent('Vaše práce u Taros Personal – doplnění informací')}&body=${encodeURIComponent(`Dobrý den,\n\nevidence zájem o pracovní pozici ${job ? (lang === 'de' ? job.title_de : job.title_cs) : '...'}\n\nPracovní pozice je stále aktuální, pro rychlejší a bezproblémové vyřízení žádosti prosím vyplňte následující dotazník. Jako přílohu je vhodné přiložit i profilovou fotografii – profil pak působí lépe. Můžete také přiložit životopis.\n\nPo zaslání žádost zpracujeme a budeme Vás informovat o dalších krocích.`)}`}
                      onClick={() => setReplyOpen(false)}
                      className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 rounded-t-xl"
                    >
                      📋 Žádost o vyplnění dotazníku
                    </a>
                    <a
                      href={`mailto:${applicant.email}?subject=${encodeURIComponent('Pozvání na pohovor – Taros Personal')}&body=${encodeURIComponent(`Dobrý den,\n\nděkujeme za Váš zájem o práci u Taros Personal.\n\nRádi bych Vás pozval na osobní pohovor. Prosím, kontaktujte mne pro dohodnutí termínu.`)}`}
                      onClick={() => setReplyOpen(false)}
                      className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                    >
                      📅 Pozvání na pohovor
                    </a>
                    <a
                      href={`mailto:${applicant.email}?subject=${encodeURIComponent('Vaše přihláška – Taros Personal')}&body=${encodeURIComponent(`Dobrý den,\n\nděkujeme za Váš zájem o práci u Taros Personal.\n\nBohužel momentálně nemáme odpovídající pracovní nabídku.\n\nSledujte naší aktuální nabídku na www.taros-personal.cz nebo na mém osobním profilu na Facebooku:\nhttps://www.facebook.com/profile.php?id=100079180028963`)}`}
                      onClick={() => setReplyOpen(false)}
                      className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 border-t border-gray-100 rounded-b-xl"
                    >
                      🙏 Momentálně bez nabídky
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6">
            {field('E-mail', applicant.email)}
            {field('Telefon', applicant.phone)}
            {field(lang === 'de' ? 'Straße' : 'Ulice', applicant.street)}
            {field(lang === 'de' ? 'Stadt' : 'Město', applicant.city)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>{tr.jobInfo}</h2>
          <div className="grid grid-cols-2 gap-x-6">
            {field(tr.position, job ? `${lang === 'de' ? job.title_de : job.title_cs} / ${job.location}` : null)}
            {field(lang === 'de' ? 'Deutschkenntnisse' : 'Němčina', applicant.german)}
            {field(lang === 'de' ? 'Führerschein' : 'Řidičský průkaz', applicant.driving_license)}
            {field(lang === 'de' ? 'Fahrzeug' : 'Automobil', applicant.has_car)}
            {field(lang === 'de' ? 'Arbeitsbeginn' : 'Nástup', applicant.start_date)}
          </div>
          {applicant.message && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{tr.message}</div>
              <p className="text-sm text-gray-600">{applicant.message}</p>
            </div>
          )}
        </div>

        {applicant.cv_url && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-medium mb-3" style={{ color: '#1a1a1a' }}>{tr.cv}</h2>
            <a
              href={applicant.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              style={{ color: '#2a4f2d' }}
            >
              📄 {tr.download}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}