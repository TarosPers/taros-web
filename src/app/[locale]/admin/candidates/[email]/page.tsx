export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  new:       { bg: '#eff6ff', color: '#3b82f6', label: 'Nový' },
  reviewing: { bg: '#fef3e6', color: '#e07b0a', label: 'Probíhá' },
  invited:   { bg: '#eaf3e8', color: '#2a4f2d', label: 'Pozván' },
  rejected:  { bg: '#fef2f2', color: '#ef4444', label: 'Zamítnut' },
  hired:     { bg: '#2a4f2d', color: '#fff',    label: 'Přijat' },
}

const Badge = ({ status }: { status: string }) => {
  const s = statusColors[status] ?? statusColors.new
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

const Field = ({ label, value }: { label: string; value?: string | null }) =>
  value && value !== 'EMPTY' ? (
    <div className="mb-3">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-gray-700">{value}</div>
    </div>
  ) : null

export default async function CandidateProfilePage({ params }: { params: { email: string } }) {
  const email = decodeURIComponent(params.email)

  const [{ data: questionnaires }, { data: applicants }] = await Promise.all([
    supabase.from('questionnaires').select('*').ilike('email', email).order('created_at', { ascending: false }),
    supabase.from('applicants').select('*, jobs(title)').ilike('email', email).order('created_at', { ascending: false }),
  ])

  if (!questionnaires?.length && !applicants?.length) notFound()

  const q = questionnaires?.[0]
  const a = applicants?.[0]
  const name = `${q?.first_name ?? a?.first_name ?? ''} ${q?.last_name ?? a?.last_name ?? ''}`.trim()
  const phone = q?.phone ?? a?.phone ?? ''
  const foto = q?.foto_url

  const formatDate = (d: string) => new Date(d).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {foto ? (
            <img src={foto} alt="Foto" className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl text-gray-300">👤</div>
          )}
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#1a1a1a' }}>{name}</h1>
            <div className="text-sm text-gray-400 mt-0.5">{email}</div>
            {phone && <div className="text-sm text-gray-400">{phone}</div>}
          </div>
        </div>
        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600">← Zpět</Link>
      </div>

      <div className="space-y-4">
        {q && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>Dotazník</h2>
              <div className="flex items-center gap-3">
                <Badge status={q.status} />
                <Link href={`/admin/questionnaires/${q.id}`} className="text-xs" style={{ color: '#2a4f2d' }}>Otevřít →</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6">
              <Field label="Hledané profese" value={[q.profese, q.profese_jina].filter(Boolean).join(', ')} />
              <Field label="Nástup" value={q.start_date} />
              <Field label="Němčina" value={q.german} />
              <Field label="Typ práce" value={q.work_type} />
              <Field label="Řidičský průkaz" value={q.driving_license} />
              <Field label="Průkaz VZV" value={q.vzv_license} />
              <Field label="Automobil" value={q.has_car} />
              <Field label="Národnost" value={q.nationality} />
              <Field label="Město" value={q.city} />
              <Field label="Vzdělání" value={q.education} />
              <Field label="Škola / Obor" value={q.education_detail} />
            </div>
            {(q.job1 || q.job2 || q.job3) && (
              <>
                <div className="border-t border-gray-100 my-3" />
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Pracovní zkušenosti</div>
                <Field label="Poslední zaměstnání" value={q.job1} />
                <Field label="Předposlední" value={q.job2} />
                <Field label="2. předposlední" value={q.job3} />
              </>
            )}
            {q.notes && (<><div className="border-t border-gray-100 my-3" /><Field label="Poznámky" value={q.notes} /></>)}
          </div>
        )}

        {applicants && applicants.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#1a1a1a' }}>Přihlášky k inzerátům ({applicants.length})</h2>
            <div className="space-y-3">
              {applicants.map((app) => (
                <div key={app.id} className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#1a1a1a' }}>{(app.jobs as any)?.title ?? 'Neznámá pozice'}</div>
                    {app.message && app.message !== 'EMPTY' && (
                      <div className="text-xs text-gray-400 mt-0.5 max-w-sm line-clamp-2">{app.message}</div>
                    )}
                    {app.cv_url && (
                      <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="text-xs mt-1 inline-block" style={{ color: '#2a4f2d' }}>📄 CV</a>
                    )}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="text-xs text-gray-300 mb-1">{formatDate(app.created_at)}</div>
                    <Badge status={app.status} />
                    <div className="mt-1">
                      <Link href={`/admin/applicants/${app.id}`} className="text-xs" style={{ color: '#2a4f2d' }}>Detail →</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}