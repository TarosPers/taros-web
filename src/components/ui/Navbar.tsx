'use client'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments[0] === 'cs' || segments[0] === 'de') {
      segments[0] = newLocale
    } else {
      if (newLocale !== 'cs') {
        segments.unshift(newLocale)
      }
    }
    const newPath = '/' + segments.join('/')
    router.push(newPath)
  }

  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-2">
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Image
            src="/images/logo.png"
            alt="Taros Personalservice GmbH"
            width={140}
            height={45}
            style={{ objectFit: 'contain' }}
          />
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/jobs" className="text-sm transition-colors" style={{ color: '#6b7280', textDecoration: 'none' }}>
            {t('jobs')}
          </Link>
          <Link href="/for-companies" className="text-sm transition-colors" style={{ color: '#6b7280', textDecoration: 'none' }}>
            {t('forCompanies')}
          </Link>
          <Link href="/about" className="text-sm transition-colors" style={{ color: '#6b7280', textDecoration: 'none' }}>
            {t('about')}
          </Link>
          <Link href="/contact" className="text-sm transition-colors" style={{ color: '#6b7280', textDecoration: 'none' }}>
            {t('contact')}
          </Link>
          <Link
            href={locale === 'de' ? '/de/dotaznik' : '/dotaznik'}
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: '#2a4f2d', color: '#fff', textDecoration: 'none' }}
          >
            {locale === 'de' ? 'Fragebogen' : 'Dotazník'}
          </Link>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => switchLocale('cs')}
              className="text-xs px-2.5 py-1 rounded-md border transition-colors"
              style={{
                background: locale === 'cs' ? '#2a4f2d' : 'transparent',
                color: locale === 'cs' ? '#fff' : '#6b7280',
                borderColor: locale === 'cs' ? '#2a4f2d' : '#d1d5db',
              }}
            >
              CS
            </button>
            <button
              onClick={() => switchLocale('de')}
              className="text-xs px-2.5 py-1 rounded-md border transition-colors"
              style={{
                background: locale === 'de' ? '#2a4f2d' : 'transparent',
                color: locale === 'de' ? '#fff' : '#6b7280',
                borderColor: locale === 'de' ? '#2a4f2d' : '#d1d5db',
              }}
            >
              DE
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
