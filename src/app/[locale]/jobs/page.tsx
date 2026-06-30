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
    title: locale === 'de' ? 'Stellenangebote | Taros Personalservice' : 'Volné pozice | Taros Personalservice',
  }
}

export default async function JobsPage() {
  const locale = await getLocale()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  const allJobs = jobs ?? []

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

      </main>
    </>
  )
}
