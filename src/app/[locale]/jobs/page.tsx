import { getLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import Navbar from '@/components/ui/Navbar'
import JobCard from '@/components/jobs/JobCard'
import { supabase } from '@/lib/supabase'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'de' ? 'Stellenangebote | Taros Personalservice' : 'Volne pozice | Taros Personalservice',
  }
}

export default async function JobsPage() {
  const locale = await getLocale()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  const sectors = [
    { key: 'production',  cs: 'Vyroba',              de: 'Produktion', icon: '⚙️' },
    { key: 'logistics',   cs: 'Logistika',            de: 'Logistik',   icon: '🚚' },
    { key: 'healthcare',  cs: 'Pece a zdravotnictvi', de: 'Pflege',     icon: '🏥' },
    { key: 'technical',   cs: 'Technicke profese',    de: 'Technik',    icon: '🔧' },
    { key: 'other',       cs: 'Ostatni',              de: 'Sonstige',   icon: '📋' },
  ]

  const allJobs = jobs ?? []
  const withSector = allJobs.filter(j => sectors.find(s => s.key === j.sector))
  const withoutSector = allJobs.filter(j => !sectors.find(s => s.key === j.sector))

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto">
        <div className="px-8 py-8" style={{ background: '#2a4f2d' }}>
          <h1 className="text-2xl font-bold text-white">
            {locale === 'de' ? 'Aktuelle Stellenangebote' : 'Aktualni nabidky prace'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {locale === 'de'
              ? `${allJobs.length} Stellen verfugbar`
              : `${allJobs.length} pozic k dispozici`}
          </p>
        </div>

        <div className="px-8 py-10">
          {allJobs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {locale === 'de' ? 'Keine Stellen verfugbar' : 'Momentalne nejsou zadne volne pozice.'}
              </p>
            </div>
          ) : (
            <>
              {sectors.map(({ key, cs, de, icon }) => {
                const sectorJobs = allJobs.filter(j => j.sector === key)
                if (sectorJobs.length === 0) return null
                return (
                  <div key={key} className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">{icon}</span>
                      <h2 className="text-lg font-medium" style={{ color: '#2a4f2d' }}>
                        {locale === 'de' ? de : cs}
                      </h2>
                      <span className="text-xs ml-1" style={{ color: '#9ca3af' }}>({sectorJobs.length})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {sectorJobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </div>
                  </div>
                )
              })}

              {withoutSector.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">📋</span>
                    <h2 className="text-lg font-medium" style={{ color: '#2a4f2d' }}>
                      {locale === 'de' ? 'Weitere Stellen' : 'Dalsi pozice'}
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {withoutSector.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}
