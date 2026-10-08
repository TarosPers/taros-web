import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AdminDashboard() {
  const { data: newQuestionnaires } = await supabase
    .from('questionnaires')
    .select('id, first_name, last_name, profese, created_at')
    .eq('status', 'new')
    .order('created_at', { ascending: false })

  const { data: newApplicants } = await supabase
    .from('applicants')
    .select('id, first_name, last_name, created_at, job_id')
    .eq('status', 'new')
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Nástěnka</h1>
      <p className="text-sm text-gray-400 mb-8">Přehled nových položek k vyřízení</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
          <div className="text-xs text-gray-400 mb-1">Aktivní pozice</div>
          <div className="text-3xl font-bold" style={{ color: '#2a4f2d' }}>{activeJobs?.length ?? 0}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
          <div className="text-xs text-gray-400 mb-1">Nové dotazníky</div>
          <div className="text-3xl font-bold" style={{ color: newQuestionnaires?.length ? '#e07b0a' : '#9ca3af' }}>
            {newQuestionnaires?.length ?? 0}
          </div>
          <div className="text-xs text-gray-300 mt-1">celkem {totalQuestionnaires ?? 0}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white px-5 py-4">
          <div className="text-xs text-gray-400 mb-1">Nové přihlášky</div>
          <div className="text-3xl font-bold" style={{ color: newApplicants?.length ? '#e07b0a' : '#9ca3af' }}>
            {newApplicants?.length ?? 0}
          </div>
          <div className="text-xs text-gray-300 mt-1">celkem {totalApplicants ?? 0}</div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-6">

        {/* Dotazníky */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
              Dotazníky k vyřízení
            </h2>
            <Link
              href="/admin/questionnaires"
              className="text-xs"
              style={{ color: '#2a4f2d' }}
            >
              Zobrazit vše →
            </Link>
          </div>

          {!newQuestionnaires?.length ? (
            <div className="rounded-xl border border-gray-100 bg-white px-5 py-8 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-gray-400">Žádné nové dotazníky</p>
            </div>
          ) : (
            <div className="space-y-2">
              {newQuestionnaires.map((q) => (
                <Link
                  key={q.id}
                  href={`/admin/questionnaires/${q.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 hover:border-orange-200 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#1a1a1a' }}>
                      {q.first_name} {q.last_name}
                    </div>
                    {q.profese && (
                      <div className="text-xs text-gray-400 mt-0.5">{q.profese}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-300">{formatDate(q.created_at)}</div>
                    <div
                      className="inline-block text-xs px-2 py-0.5 rounded-full mt-1"
                      style={{ background: '#fff3e0', color: '#e07b0a' }}
                    >
                      nový
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Přihlášky */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
              Přihlášky k vyřízení
            </h2>
            <Link
              href="/admin/applicants"
              className="text-xs"
              style={{ color: '#2a4f2d' }}
            >
              Zobrazit vše →
            </Link>
          </div>

          {!newApplicants?.length ? (
            <div className="rounded-xl border border-gray-100 bg-white px-5 py-8 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-gray-400">Žádné nové přihlášky</p>
            </div>
          ) : (
            <div className="space-y-2">
              {newApplicants.map((a) => (
                <Link
                  key={a.id}
                  href={`/admin/applicants/${a.id}`}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 hover:border-orange-200 transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#1a1a1a' }}>
                      {a.first_name} {a.last_name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">přihláška #{String(a.id).slice(0, 6)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-300">{formatDate(a.created_at)}</div>
                    <div
                      className="inline-block text-xs px-2 py-0.5 rounded-full mt-1"
                      style={{ background: '#fff3e0', color: '#e07b0a' }}
                    >
                      nová
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quick actions */}
      <div className="mt-10 pt-8 border-t border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Rychlé akce</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#2a4f2d', color: '#fff', textDecoration: 'none' }}
          >
            + Přidat pozici
          </Link>
          <Link
            href="/admin/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white"
            style={{ color: '#374151', textDecoration: 'none' }}
          >
            Správa pozic
          </Link>
          <Link
            href="/admin/questionnaires"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white"
            style={{ color: '#374151', textDecoration: 'none' }}
          >
            Všechny dotazníky
          </Link>
          <Link
            href="/admin/applicants"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white"
            style={{ color: '#374151', textDecoration: 'none' }}
          >
            Všechny přihlášky
          </Link>
        </div>
      </div>
    </div>
  )
}
