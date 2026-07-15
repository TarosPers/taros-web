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
  const { locale, slug } = await params
  const { data: job } = await supabase.from('jobs').select('*').eq('slug', slug).single()
  if (!job) return {}
  const title = locale === 'de' ? job.title_de : job.title_cs
  return {
    title: `${title} – ${job.location} | Taros Personalservice`,
    description: locale === 'de' ? job.description_de?.slice(0, 160) : job.description_cs?.slice(0, 160),
    openGraph: {
      title: `${title} – ${job.location}`,
      images: job.og_image_fb_url ? [job.og_image_fb_url] : job.og_image_url ? [job.og_image_url] : ['/images/hero-cs.jpg'],
    },
  }
}

export default async function JobDetailPage({ params }: Props) {
  const { locale, slug } = await params
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!job) notFound()

  // Na německé verzi skryj inzeráty, které nemají kompletní německý text
  if (locale === 'de' && (!job.title_de || !job.description_de)) notFound()

  const t = await getTranslations({ locale, namespace: 'jobs' })
  const title = locale === 'de' ? job.title_de : job.title_cs
  const description = locale === 'de' ? job.description_de : job.description_cs

  const typeLabels: Record<string, string> = {
    fulltime:  locale === 'de' ? 'Vollzeit' : 'Plný úvazek',
    parttime:  locale === 'de' ? 'Teilzeit' : 'Zkracený úvazek',
    temporary: locale === 'de' ? 'Zeitarbeit' : 'Dočasny',
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const jobUrl = `${siteUrl}${locale === 'de' ? '/de' : ''}/jobs/${slug}`
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`
  const imageUrl = locale === 'de' && job.og_image_url_de ? job.og_image_url_de : job.og_image_url

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto">

        {/* Hlavička */}
        <div className="px-4 sm:px-8 py-6" style={{ background: '#2a4f2d' }}>
          <a href="/jobs" className="text-xs block mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {`<- `}{t('backToJobs')}
          </a>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <div className="flex flex-wrap gap-4 mt-3">
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{job.location}</span>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{typeLabels[job.type?.split(',')[0]] ?? job.type}</span>
            {job.salary_range && <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{job.salary_range}</span>}
          </div>
        </div>

        {/* Obrázek – pouze na mobilu nahoře */}
        {imageUrl && (
          <div className="block sm:hidden w-full">
            <img src={imageUrl} alt={title} className="w-full h-auto block" />
          </div>
        )}

        {/* Hlavní obsah */}
        <div className="px-4 sm:px-8 pt-8 pb-4">
          <div className="flex flex-col sm:grid sm:gap-8" style={{ gridTemplateColumns: '2fr 1fr' }}>

            {/* Popis */}
            <div className="mb-8 sm:mb-0">
              {description ? (
                <div
                  className="prose prose-sm max-w-none leading-relaxed"
                  style={{ color: '#374151' }}
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              ) : (
                <p className="text-sm" style={{ color: '#9ca3af' }}>
                  {locale === 'de' ? 'Beschreibung folgt in Kurze.' : 'Popis pozice brzy doplnime.'}
                </p>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">

              {/* Obrázek – pouze na desktopu */}
              {imageUrl && (
                <div className="hidden sm:block rounded-xl overflow-hidden border border-gray-100">
                  <img src={imageUrl} alt={title} className="w-full h-auto block" />
                </div>
              )}

              {/* Bez obrázku placeholder – pouze na desktopu */}
              {!imageUrl && (
                <div className="hidden sm:flex rounded-xl overflow-hidden border border-gray-100 items-center justify-center" style={{ background: 'linear-gradient(135deg, #2a4f2d 0%, #3a6b3d 100%)', aspectRatio: '940/788' }}>
                  <div className="text-center">
                    <div className="text-5xl mb-3" style={{ opacity: 0.3 }}>💼</div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {locale === 'de' ? 'Kein Bild verfugbar' : 'Obrazek nebyl pridan'}
                    </p>
                  </div>
                </div>
              )}

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

              {job.maps_url && (
                <a
                  href={job.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors text-sm font-medium"
                  style={{ color: '#2a4f2d', textDecoration: 'none' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a4f2d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {locale === 'de' ? 'In Google Maps offnen' : 'Otevrit v Google Maps'}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Formulář */}
        <div className="px-4 sm:px-8 py-8 border-t border-gray-100">
          <h2 className="text-xl font-bold mb-2 uppercase tracking-wide" style={{ color: '#1e3d21' }}>
            {locale === 'de' ? 'Jetzt bewerben' : 'Zažádat hned'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {locale === 'de' ? (
              <>Wenn Sie sich für diese Stelle interessieren. Für weitere Positionen füllen Sie bitte <a href="/de/dotaznik" style={{ color: '#2a4f2d' }}>den Fragebogen</a> aus.</>
            ) : (
              <>Pokud se zajímáte konkrétně o toto pracovní místo. Pokud máte zájem i o další pozice, vyplňte <a href="/dotaznik" style={{ color: '#2a4f2d' }}>dotazník</a>.</>
            )}
          </p>
          <JobApplicationForm
            jobId={job.id}
            jobTitle={title}
            jobLocation={job.location}
            locale={locale}
          />
        </div>

      </main>
    </>
  )
}
