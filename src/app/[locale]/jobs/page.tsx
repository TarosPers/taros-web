import { getLocale, getTranslations } from 'next-intl/server'
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
    title: locale === 'de' ? 'Stellenangebote | Taros Personalservice' : 'Volné pozice | Taros Personalservice',
  }
}

export default async function JobsPage() {
  const locale = await getLocale()
  const t = await getTranslations('questionnaireBanner')

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('active', true)
    .eq('listing_type', 'standard')
    .order('created_at', { ascending: false })

  const allJobs = (jobs ?? []).filter((job) => {
    if (locale !== 'de') return true
    return Boolean(job.title_de) && Boolean(job.description_de)
  })
  const dotaznikHref = locale === 'de' ? '/de/dotaznik' : '/dotaznik'

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto">

        {/* Banner */}
        <div className="w-full border-b border-gray-200">
          <img
            src={locale === 'de' ? '/images/hero-de.jpg' : '/images/hero-cs.jpg'}
            alt="Taros Personalservice"
            className="w-full h-auto block"
          />
        </div>
<br></br>
        {/* Nadpis */}
        <div className="px-8 pt-8 pb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>
            {locale === 'de' ? 'Aktuelle Stellenangebote' : 'Aktuální nabídky práce'}
          </h1>
          
        </div>

        {/* Seznam pozic */}
        <div className="px-8 py-10">
          {allJobs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-gray-400">
                {locale === 'de' ? 'Keine Stellen verfügbar' : 'Momentálně nejsou žádné volné pozice.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Banner - Dotazník CTA */}
        <div className="px-4 sm:px-8 pb-12">
          <div
            className="rounded-2xl px-6 sm:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            style={{ background: '#eaf3e8', border: '1px solid rgba(42, 79, 45, 0.12)' }}
          >
            <div>
              <div className="text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: '#e07b0a' }}>
                {t('eyebrow')}
              </div>
              <h3 className="text-xl font-medium mb-1" style={{ color: '#1e3d21' }}>
                {t('title')}
              </h3>
              <p className="text-sm text-gray-600">{t('subtitle')}</p>
            </div>
            <a
              href={dotaznikHref}
              className="shrink-0 inline-flex items-center justify-center rounded-lg text-sm font-medium px-6 py-3 transition-colors"
              style={{ background: '#e07b0a', color: '#fff' }}
            >
              {t('cta')}
            </a>
          </div>
        </div>

      </main>
    </>
  )
}
