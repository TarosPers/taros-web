import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { getLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import Navbar from '@/components/ui/Navbar'
import ContactForm from '@/components/ui/ContactForm'
import JobCard from '@/components/jobs/JobCard'
import { supabase } from '@/lib/supabase'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })
  return {
    title: `Taros Personalservice – ${t('title')} ${t('titleHighlight')}`,
    description: `${t('slogan')} ${t('sloganHighlight')}`,
  }
}

export default async function HomePage() {
  const locale = await getLocale()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(4)

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto">
        <HeroBanner locale={locale} />
        <JobsSection jobs={jobs ?? []} />
        <HowItWorksSection />
        <CtaBand />
        <ContactSection />
      </main>
    </>
  )
}

function HeroBanner({ locale }: { locale: string }) {
  return (
    <div className="w-full border-b border-gray-200">
      <img
        src={locale === 'de' ? '/images/hero-de.jpg' : '/images/hero-cs.jpg'}
        alt="Taros Personalservice"
        className="w-full h-auto block"
      />
    </div>
  )
}

function JobsSection({ jobs }: { jobs: any[] }) {
  const t = useTranslations('jobs')
  return (
    <section id="jobs" className="px-4 sm:px-8 py-12 border-b border-gray-100">
      <div className="section-label">{t('sectionLabel')}</div>
      <h2 className="section-title">{t('title')}</h2>
      <p className="text-sm text-gray-500 mb-7">{t('subtitle')}</p>
      {jobs.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('noJobs')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
      <a
        href="/jobs"
        className="inline-flex items-center gap-2 mt-6 text-sm transition-colors"
        style={{ color: '#2a4f2d' }}
      >
        {t('allJobs')}
      </a>
    </section>
  )
}

function HowItWorksSection() {
  const t = useTranslations('howItWorks')
  const steps = [
    { num: '01', icon: '📝', titleKey: 'step1Title', descKey: 'step1Desc' },
    { num: '02', icon: '📞', titleKey: 'step2Title', descKey: 'step2Desc' },
    { num: '03', icon: '🤝', titleKey: 'step3Title', descKey: 'step3Desc' },
    { num: '04', icon: '✅', titleKey: 'step4Title', descKey: 'step4Desc' },
  ] as const
  return (
    <section className="px-4 sm:px-8 py-12 bg-gray-50 border-b border-gray-100">
      <div className="section-label">{t('sectionLabel')}</div>
      <h2 className="section-title">{t('title')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {steps.map(({ num, icon, titleKey, descKey }) => (
          <div
            key={num}
            className="bg-white border border-gray-100 rounded-xl p-5 hover:border-green-400 transition-colors"
          >
            <div className="text-xs font-medium mb-2 tracking-wide" style={{ color: '#e07b0a' }}>{num}</div>
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-sm font-medium mb-1" style={{ color: '#383838' }}>{t(titleKey)}</div>
            <div className="text-xs text-gray-500 leading-relaxed">{t(descKey)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CtaBand() {
  const t = useTranslations('cta')
  return (
    <section
      className="px-4 sm:px-8 py-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b"
      style={{ background: '#2a4f2d', borderColor: '#1e3d21' }}
    >
      <h3 className="text-xl font-normal text-white leading-snug">
        {t('title')}
        <br />
        <strong style={{ color: '#f5a030', fontWeight: 500 }}>{t('titleHighlight')}</strong>
      </h3>
      <div className="flex gap-3">
        <a
          href="/jobs"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-lg text-sm font-medium"
          style={{ color: '#2a4f2d' }}
        >
          {t('btnJobs')}
        </a>
        <a
          href="/for-companies"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: '#e07b0a', color: '#fff' }}
        >
          {t('btnCompany')}
        </a>
      </div>
    </section>
  )
}

function ContactSection() {
  const t = useTranslations('contact')
  const contactItems = [
    { icon: '📍', text: 'Dr.-Schott-Straße 49, 94227 Zwiesel' },
    { icon: '📞', text: '09922 / 869 1234' },
    { icon: '📞', text: '+420 601 506 010' },
    { icon: '✉️', text: 'info@taros-personal.de' },
    { icon: '🕐', text: t('hours') },
  ]
  return (
    <section className="px-4 sm:px-8 py-12 border-b border-gray-100">
      <div className="section-label">{t('sectionLabel')}</div>
      <h2 className="section-title">{t('title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mt-6">
        <div>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">{t('description')}</p>
          {contactItems.map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-gray-500 mb-2.5">
              <span className="text-base" style={{ color: '#2a4f2d' }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
        <ContactForm />
      </div>
    </section>
  )
}
