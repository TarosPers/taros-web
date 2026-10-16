import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    new:       { label: 'Nový',        color: 'bg-blue-100 text-blue-700' },
    contacted: { label: 'Kontaktován', color: 'bg-yellow-100 text-yellow-700' },
    hired:     { label: 'Přijat',      color: 'bg-green-100 text-green-700' },
    rejected:  { label: 'Odmítnut',    color: 'bg-red-100 text-red-700' },
  }
  const s = map[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
}

export default async function CandidateProfilePage({
  params,
}: {
  params: { locale: string; email: string }
}) {
  const email = decodeURIComponent(params.email)
  const locale = params.locale

  const [{ data: questionnaires }, { data: applications }] = await Promise.all([
    supabase.from('questionnaires').select('id, first_name, last_name, phone, street, city, zip, created_at, status').eq('email', email).order('created_at', { ascending: false }),
    supabase.from('applicants').select('id, first_name, last_name, created_at, status, jobs(title)').eq('email', email).order('created_at', { ascending: false }),
  ])

  if (!questionnaires?.length && !applications?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">Kandidát nenalezen</div>
          <Link href={`/${locale}/admin`} className="text-sm text-orange-500 hover:underline">← Zpět na přehled</Link>
        </div>
      </div>
    )
  }

  const q0 = questionnaires?.[0]
  const first = q0 ?? applications?.[0]
  const fullName = first ? `${first.first_name} ${first.last_name}` : email
  const address = q0 ? [q0.street, q0.city, q0.zip].filter(Boolean).join(', ') : null
  const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('cs-CZ') : '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Hlavička */}
        <Link href={`/${locale}/admin`} className="text-xs text-gray-400 hover:text-gray-600 mb-2 inline-block">
          ← Zpět na přehled
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{fullName}</h1>
        <div className="text-sm text-gray-500 space-y-1 mb-6">
          {address && <div><span className="text-gray-400">Adresa:</span> {address}</div>}
          {q0?.phone && <div><span className="text-gray-400">Telefon:</span> {q0.phone}</div>}
          <div><span className="text-gray-400">Email:</span> {email}</div>
        </div>

        {/* Přihlášky */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Přihlášky na pozice
          </h2>
          {applications && applications.length > 0 ? (
            <div>
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">
                      {(app.jobs as any)?.title ?? `Pozice #${app.id}`}
                    </span>
                    <StatusBadge status={app.status ?? 'new'} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-300">{formatDate(app.created_at)}</span>
                    <Link href={`/${locale}/admin/applicants/${app.id}`} className="text-xs text-orange-500 hover:underline">
                      Otevřít →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-300">—</div>
          )}
        </div>

        {/* Dotazníky */}
        {questionnaires && questionnaires.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Dotazníky ({questionnaires.length})
            </h2>
            <div>
              {questionnaires.map((q, idx) => (
                <div key={q.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">
                      Dotazník{questionnaires.length > 1 ? ` #${idx + 1}` : ''}
                    </span>
                    <StatusBadge status={q.status ?? 'new'} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-300">{formatDate(q.created_at)}</span>
                    <Link href={`/${locale}/admin/questionnaires/${q.id}`} className="text-xs text-orange-500 hover:underline">
                      Otevřít →
                    </Link>
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