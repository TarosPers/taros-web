import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import { supabase } from '@/lib/supabase'
import JobApplicationForm from '@/components/jobs/JobApplicationForm'
import QRCodeSection from '@/components/jobs/QRCodeSection'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: job } = await supabase.from('jobs').select('*').eq('slug', slug).eq('listing_type', 'general').single()
  if (!job) return {}
  return {
    title: `${job.title_cs} – ${job.location} | Taros Personalservice`,
    openGraph: {
      title: `${job.title_cs} – ${job.location}`,
      images: job.og_image_fb_url ? [job.og_image_fb_url] : ['/images/hero-cs.jpg'],
    },
  }
}

export default async function GeneralListingPage({ params }: Props) {
  const { locale, slug } = await params
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .eq('listing_type', 'general')
    .single()

  if (!job) notFound()

  const t = await getTranslations({ locale, namespace: 'jobs' })

  const typeLabels: Record<string, string> = {
    fulltime:  locale === 'de' ? 'Vollzeit' : 'Plný úvazek',
    parttime:  locale === 'de' ? 'Teilzeit' : 'Zkracený úvazek',
    temporary: locale === 'de' ? 'Zeitarbeit' : 'Dočasny',
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const jobUrl = `${siteUrl}${locale === 'de' ? '/de' : ''}/hledas/${slug}`
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto">

        <div className="px-8 py-6" style={{ background: '#2a4f2d' }}>
          <h1 className="text-2xl font-bold text-white">{job.title_cs}</h1>
          <div className="flex flex-wrap gap-6 mt-3">
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {job.location}
            </span>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {typeLabels[job.type?.split(',')[0]] ?? job.type}
            </span>
          </div>
        </div>

        <div className="grid gap-8 px-8 pt-10 pb-4" style={{ gridTemplateColumns: '1fr' }}>
          <div className="space-y-4" style={{ maxWidth: '480px' }}>

            <div className="rounded-xl overflow-hidden border border-gray-100">
              {job.og_image_fb_url ? (
                <img
                  src={job.og_image_fb_url}
                  alt={job.title_cs}
                  className="w-full h-auto block"
                />
              ) : (
                <div
                  className="w-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #2a4f2d 0%, #3a6b3d 100%)', aspectRatio: '1200/630' }}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3" style={{ opacity: 0.3 }}>💼</div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {locale === 'de' ? 'Kein Bild verfugbar' : 'Obrazek nebyl pridan'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <a
              href={fbShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors text-sm font-medium"
              style={{ color: '#1877F2', textDecoration: 'none' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              {t('shareOnFacebook')}
            </a>

            <div className="px-4 py-4 rounded-xl border border-gray-100 bg-white">
              <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>
                {locale === 'de' ? 'Per QR-Code teilen' : 'Sdilet QR kodem'}
              </p>
              <QRCodeSection url={jobUrl} locale={locale} />
            </div>

          </div>
        </div>

        <div className="px-8 py-8 border-t border-gray-100">
          <h2 className="text-xl font-bold mb-2 uppercase tracking-wide" style={{ color: '#1e3d21' }}>
            {locale === 'de' ? 'Jetzt bewerben' : 'Zažádat hned'}
          </h2>
          <JobApplicationForm
            jobId={job.id}
            jobTitle={job.title_cs}
            jobLocation={job.location}
            locale={locale}
          />
        </div>

      </main>
    </>
  )
}
