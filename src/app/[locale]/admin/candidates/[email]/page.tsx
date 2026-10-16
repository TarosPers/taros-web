import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm text-gray-800 font-medium">{value || '—'}</div>
    </div>
  )
}

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
    supabase
      .from('questionnaires')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false }),
    supabase
      .from('applicants')
      .select('*, jobs(title)')
      .eq('email', email)
      .order('created_at', { ascending: false }),
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

  const first = questionnaires?.[0]
  const fullName = first
    ? `${first.first_name} ${first.last_name}`
    : applications?.[0]
    ? `${applications[0].first_name} ${applications[0].last_name}`
    : email

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('cs-CZ') : '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link href={`/${locale}/admin`} className="text-xs text-gray-400 hover:text-gray-600 mb-1 inline-block">
              ← Zpět na přehled
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <div className="text-sm text-gray-400 mt-0.5">{email}</div>
          </div>
          {questionnaires?.[0] && (
            <div className="mt-4">
              <Link
                href={`/${locale}/admin/questionnaires/${questionnaires[0].id}`}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
              >
                Otevřít dotazník
              </Link>
            </div>
          )}
        </div>

        {/* Dotazníky */}
        {questionnaires?.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-800">
                  Dotazník{questionnaires.length > 1 ? ` #${idx + 1}` : ''}
                </h2>
                <StatusBadge status={q.status ?? 'new'} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-300">{formatDate(q.created_at)}</span>
                <Link href={`/${locale}/admin/questionnaires/${q.id}`} className="text-xs text-orange-500 hover:underline">
                  Detail →
                </Link>
              </div>
            </div>

            <Section title="Osobní údaje">
              <Field label="Jméno" value={q.first_name} />
              <Field label="Příjmení" value={q.last_name} />
              <Field label="Datum narození" value={q.birth_date} />
              <Field label="Národnost" value={q.nationality} />
              <Field label="Rodinný stav" value={q.marital_status} />
            </Section>

            <Section title="Kontakt">
              <Field label="Email" value={q.email} />
              <Field label="Telefon" value={q.phone} />
              <Field label="Ulice" value={q.street} />
              <Field label="Město" value={q.city} />
              <Field label="PSČ" value={q.zip} />
            </Section>

            <Section title="Pracovní preference">
              <Field label="Hledané profese" value={q.profese} />
              <Field label="Nástup" value={q.start_date} />
              <Field label="Němčina" value={q.german} />
              <Field label="Typ práce" value={q.work_type} />
              <Field label="Řidičský průkaz" value={q.driving_license} />
              <Field label="Průkaz VZV" value={q.vzv_license} />
              <Field label="Vlastní auto" value={q.has_car} />
            </Section>

            <Section title="Vzdělání">
              <Field label="ZŠ" value={q.primary_school} />
              <Field label="Vzdělání" value={q.education} />
              <Field label="Obor / škola" value={q.education_detail} />
            </Section>

            <Section title="Pracovní zkušenosti">
              <Field label="Zaměstnání 1" value={q.job1} />
              <Field label="Zaměstnání 2" value={q.job2} />
              <Field label="Zaměstnání 3" value={q.job3} />
            </Section>

            {q.message && (
              <div className="mt-2 pt-4 border-t border-gray-50">
                <div className="text-xs text-gray-400 mb-1">Zpráva / poznámka</div>
                <p className="text-sm text-gray-700">{q.message}</p>
              </div>
            )}

            {(q.foto_url || q.cv_url) && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="text-xs text-gray-400 mb-2">Přílohy</div>
                <div className="flex gap-3">
                  {q.foto_url && (
                    <a href={q.foto_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600">
                      📷 Fotografie
                    </a>
                  )}
                  {q.cv_url && (
                    <a href={q.cv_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600">
                      📄 CV
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Přihlášky */}
        {applications && applications.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Přihlášky na pracovní pozice ({applications.length})
            </h2>
            <div className="space-y-0">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {(app.jobs as any)?.title ?? `Pozice #${app.job_id}`}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(app.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status ?? 'new'} />
                    <Link href={`/${locale}/admin/applicants/${app.id}`} className="text-xs text-orange-500 hover:underline">
                      Detail →
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