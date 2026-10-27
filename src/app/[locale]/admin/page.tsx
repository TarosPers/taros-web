export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { AutoRefresh } from './auto-refresh'
import { CollapsibleSection } from './collapsible-section'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    new:       { bg: '#eff6ff', color: '#3b82f6', label: 'nový' },
    reviewing: { bg: '#fef3e6', color: '#e07b0a', label: 'probíhá' },
    invited:   { bg: '#eaf3e8', color: '#2a4f2d', label: 'pozván' },
  }
  const s = map[status] ?? map.new
  return (
    <div className="inline-block text-xs px-2 py-0.5 rounded-full mt-1" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </div>
  )
}

const itemCard = (
  href: string,
  title: string,
  subtitle: string | null,
  date: string,
  status: string,
  hasNotes: boolean,
  hasFoto?: boolean,
  hasCv?: boolean,
  profileHref?: string,
  profileLabel?: string
) => (
  <div
    key={href}
    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 hover:border-orange-200 transition-colors"
  >
    <div>
      <div className="flex items-center gap-1.5">
        <Link href={href} className="text-sm font-medium hover:underline" style={{ color: '#1a1a1a', textDecoration: 'none' }}>{title}</Link>
        {hasNotes && <span title="Obsahuje poznámky" className="text-sm leading-none">📝</span>}
        {hasFoto && <span title="Přiložena fotografie" className="text-sm leading-none">📷</span>}
        {hasCv && <span title="Přiložen životopis" className="text-sm leading-none">📄</span>}
      </div>
      {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      {profileHref && (
        <Link href={profileHref} className="text-xs mt-1 inline-block" style={{ color: '#2a4f2d' }}>
          📋 {profileLabel ?? 'Dotazník'}
        </Link>
      )}
    </div>
    <div className="text-right">
      <div className="text-xs text-gray-300">{date}</div>
      {statusBadge(status)}
    </div>
  </div>
)

export default async function AdminDashboard() {
  const { data: questionnaires } = await supabase
    .from('questionnaires')
    .select('id, first_name, last_name, email, profese, created_at, status, notes, has_foto, has_cv')
    .in('status', ['new', 'reviewing', 'invited'])
    .order('created_at', { ascending: false })

  const { data: applicants } = await supabase
    .from('applicants')
    .select('id, first_name, last_name, email, created_at, job_id, status, notes')
    .in('status', ['new', 'reviewing', 'invited'])
    .order('created_at', { ascending: false })

  const { data: activeJobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('active', true)

  const { count: totalQuestionnaires } = await supabase
    .from('questionnaires')
    .select('id', { count: 'exact', head: true })

  const { count: totalApplicants } = await supabase
    .from('applicants')
    .select('id', { count: 'exact', head: true })

  const applicantEmails = [...new Set((applicants ?? []).map(a => a.email).filter(Boolean))]
  let emailToQId: Record<string, string> = {}
  if (applicantEmails.length > 0) {
    const { data: qByEmail } = await supabase
      .from('questionnaires')
      .select('id, email, created_at')
      .in('email', applicantEmails)
      .order('created_at', { ascending: false })
    for (const q of qByEmail ?? []) {
      if (!emailToQId[q.email]) emailToQId[q.email] = q.id
    }
  }

  const qEmails = [...new Set((questionnaires ?? []).map(q => q.email).filter(Boolean))]
  let emailToAppCount: Record<string, number> = {}
  if (qEmails.length > 0) {
    const { data: appsByEmail } = await supabase
      .from('applicants')
      .select('email')
      .in('email', qEmails)
    for (const a of appsByEmail ?? []) {
      emailToAppCount[a.email] = (emailToAppCount[a.email] ?? 0) + 1
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const newQ = questionnaires?.filter(q => q.status === 'new') ?? []
  const inProgressQ = questionnaires?.filter(q => q.status !== 'new') ?? []
  const newA = applicants?.filter(a => a.status === 'new') ?? []
  const inProgressA = applicants?.filter(a => a.status !== 'new') ?? []

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Nástěnka</h1>
      <p className="text-sm text-gray-400 mb-8">Přehled položek k vyřízení</p>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
          <div className="text-xs text-gray-400 mb-1">Aktivní pozice</div>
          <div className="text-3xl font-bold" style={{ color: '#2a4f2d' }}>{activeJobs?.length ?? 0}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
          <div className="text-xs text-gray-400 mb-1">Dotazníky k vyřízení</div>
          <div className="text-2xl font-bold mt-1" style={{ color: (questionnaires?.length ?? 0) > 0 ? '#e07b0a' : '#9ca3af' }}>
            Celkem: {questionnaires?.length ?? 0}
          </div>
          <div className="text-2xl font-bold mt-1" style={{ color: newQ.length > 0 ? '#2a7a2a' : '#9ca3af' }}>
            Nové: {newQ.length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
          <div className="text-xs text-gray-400 mb-1">Přihlášky k vyřízení</div>
          <div className="text-2xl font-bold mt-1" style={{ color: (applicants?.length ?? 0) > 0 ? '#e07b0a' : '#9ca3af' }}>
            Celkem: {applicants?.length ?? 0}
          </div>
          <div className="text-2xl font-bold mt-1" style={{ color: newA.length > 0 ? '#2a7a2a' : '#9ca3af' }}>
            Nové: {newA.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Dotazníky */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>Dotazníky k vyřízení</h2>
            <Link href="/admin/questionnaires" className="text-xs" style={{ color: '#2a4f2d' }}>Zobrazit vše →</Link>
          </div>
          {!questionnaires?.length ? (
            <div className="rounded-xl border border-gray-100 bg-white px-5 py-8 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-gray-400">Žádné dotazníky k vyřízení</p>
            </div>
          ) : (
            <div className="space-y-2">
              {newQ.map((q) => {
                const appCount = emailToAppCount[q.email] ?? 0
                const subtitle = [q.profese, appCount > 0 ? `${appCount} přihláška${appCount > 1 ? (appCount < 5 ? 'y' : '') : ''}` : null].filter(Boolean).join(' · ')
                return itemCard(
                  `/admin/questionnaires/${q.id}`,
                  `${q.first_name} ${q.last_name}`,
                  subtitle || null,
                  formatDate(q.created_at),
                  q.status,
                  !!q.notes,
                  !!q.has_foto,
                  !!q.has_cv
                )
              })}
              {inProgressQ.length > 0 && (
                <CollapsibleSection label={`Probíhající (${inProgressQ.length})`}>
                  {inProgressQ.map((q) => {
                    const appCount = emailToAppCount[q.email] ?? 0
                    const subtitle = [q.profese, appCount > 0 ? `${appCount} přihláška${appCount > 1 ? (appCount < 5 ? 'y' : '') : ''}` : null].filter(Boolean).join(' · ')
                    return itemCard(
                      `/admin/questionnaires/${q.id}`,
                      `${q.first_name} ${q.last_name}`,
                      subtitle || null,
                      formatDate(q.created_at),
                      q.status,
                      !!q.notes,
                      !!q.has_foto,
                      !!q.has_cv
                    )
                  })}
                </CollapsibleSection>
              )}
            </div>
          )}
        </div>

        {/* Přihlášky */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>Přihlášky k vyřízení</h2>
            <Link href="/admin/applicants" className="text-xs" style={{ color: '#2a4f2d' }}>Zobrazit vše →</Link>
          </div>
          {!applicants?.length ? (
            <div className="rounded-xl border border-gray-100 bg-white px-5 py-8 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-gray-400">Žádné přihlášky k vyřízení</p>
            </div>
          ) : (
            <div className="space-y-2">
              {newA.map((a) => itemCard(
                `/admin/applicants/${a.id}`,
                `${a.first_name} ${a.last_name}`,
                `přihláška #${String(a.id).slice(0, 6)}`,
                formatDate(a.created_at),
                a.status,
                !!a.notes,
                false,
                false,
                emailToQId[a.email] ? `/admin/questionnaires/${emailToQId[a.email]}` : undefined,
                'Dotazník'
              ))}
              {inProgressA.length > 0 && (
                <CollapsibleSection label={`Probíhající (${inProgressA.length})`}>
                  {inProgressA.map((a) => itemCard(
                    `/admin/applicants/${a.id}`,
                    `${a.first_name} ${a.last_name}`,
                    `přihláška #${String(a.id).slice(0, 6)}`,
                    formatDate(a.created_at),
                    a.status,
                    !!a.notes,
                    false,
                    false,
                    emailToQId[a.email] ? `/admin/questionnaires/${emailToQId[a.email]}` : undefined,
                    'Dotazník'
                  ))}
                </CollapsibleSection>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Rychlé akce</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/jobs/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: '#2a4f2d', color: '#fff', textDecoration: 'none' }}>
            + Přidat pozici
          </Link>
          <Link href="/admin/jobs" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white" style={{ color: '#374151', textDecoration: 'none' }}>
            Správa pozic
          </Link>
          <Link href="/admin/questionnaires" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white" style={{ color: '#374151', textDecoration: 'none' }}>
            Všechny dotazníky
          </Link>
          <Link href="/admin/applicants" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white" style={{ color: '#374151', textDecoration: 'none' }}>
            Všechny přihlášky
          </Link>
        </div>
      </div>
      <AutoRefresh />
    </div>
  )
}