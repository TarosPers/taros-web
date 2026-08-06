import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/ui/Navbar'
import { supabase } from '@/lib/supabase'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .eq('listing_type', 'general')
    .single()

  if (!job) return {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.taros-personal.cz'

  return {
    title: `${job.title_cs} | Taros Personalservice`,
    description: `Práce v Německu – ${job.location}. Vyplňte dotazník a ozveme se Vám.`,
    openGraph: {
      title: job.title_cs,
      description: `Práce v Německu – ${job.location}. Vyplňte dotazník a ozveme se Vám.`,
      url: `${siteUrl}/hledas/${slug}`,
      type: 'website',
      images: job.og_image_fb_url
        ? [{ url: job.og_image_fb_url, width: 1200, height: 630 }]
        : [{ url: '/images/hero-cs.jpg', width: 1200, height: 630 }],
    },
  }
}

const typeLabels: Record<string, Record<string, string>> = {
  fulltime: { cs: 'Plný úvazek', de: 'Vollzeit' },
  parttime: { cs: 'Zkrácený úvazek', de: 'Teilzeit' },
  temporary: { cs: 'Dočasný', de: 'Zeitarbeit' },
}

export default async function GeneralJobPage({ params }: Props) {
  const { locale, slug } = await params

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .eq('listing_type', 'general')
    .eq('active', true)
    .single()

  if (!job) notFound()

  const types = (job.type ?? '').split(',').filter(Boolean)
  const dotaznikHref = locale === 'de' ? '/de/dotaznik' : '/dotaznik'

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-8">

        <div className="rounded-xl overflow-hidden border border-gray-100 mt-6">
          {job.og_image_fb_url && (
            <img src={job.og_image_fb_url} alt={job.title_cs} className="w-full h-auto block" />
          )}

          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
              {job.title_cs}
            </h1>

            <div className="flex flex-wrap gap-3 mb-6">
              <span
                className="text-sm px-3 py-1.5 rounded-full"
                style={{ background: '#eaf3e8', color: '#2a4f2d' }}
              >
                📍 {job.location}
              </span>
              {types.map((type: string) => (
                <span
                  key={type}
                  className="text-sm px-3 py-1.5 rounded-full"
                  style={{ background: '#eaf3e8', color: '#2a4f2d' }}
                >
                  {typeLabels[type]?.[locale === 'de' ? 'de' : 'cs'] ?? type}
                </span>
              ))}
            </div>

            <p className="text-sm mb-8" style={{ color: '#374151', lineHeight: 1.7 }}>
              {locale === 'de'
                ? 'Wir suchen motivierte Mitarbeiter für verschiedene Positionen in Deutschland. Nicht sicher, was zu Ihnen passt? Füllen Sie den kurzen Fragebogen aus – wir finden die passende Stelle für Sie und melden uns innerhalb von 48 Stunden.'
                : 'Hledáme šikovné lidi na různé pozice v Německu. Nevíte přesně, co by Vám sedělo? Vyplňte krátký dotazník – zjistíme, jaká práce se pro Vás nejlépe hodí, a ozveme se Vám do 48 hodin.'}
            </p>

            <a
              href={dotaznikHref}
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 rounded-lg text-sm font-medium text-white"
              style={{ background: '#e07b0a' }}
            >
              {locale === 'de' ? 'Fragebogen ausfüllen →' : 'Vyplnit dotazník →'}
            </a>
          </div>
        </div>

      </main>
    </>
  )
}
