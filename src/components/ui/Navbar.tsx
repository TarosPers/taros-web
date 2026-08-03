'use client'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const prefix = locale === 'de' ? '/de' : ''
  const [menuOpen, setMenuOpen] = useState(false)

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
    setMenuOpen(false)
  }

  const navLinks = [
    { href: `${prefix}/jobs`, label: t('jobs'), anchor: false },
    { href: `${prefix}/for-companies`, label: t('forCompanies'), anchor: false },
    { href: '#contact', label: t('contact'), anchor: true },
  ]

  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-2">
        {/* Logo */}
        <Link href={prefix || '/'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Image
            src="/images/logo.png"
            alt="Taros Personalservice GmbH"
            width={120}
            height={40}
            style={{ objectFit: 'contain' }}
          />
        </Link>

        {/* Desktop menu */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map(({ href, label, anchor }) =>
            anchor ? (
              <a key={href} href={href} className="text-sm transition-colors" style={{ color: '#6b7280', textDecoration: 'none' }}>
                {label}
              </a>
            ) : (
              <Link key={href} href={href} className="text-sm transition-colors" style={{ color: '#6b7280', textDecoration: 'none' }}>
                {label}
              </Link>
            )
          )}
          <Link
            href={`${prefix}/dotaznik`}
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: '#2a4f2d', color: '#fff', textDecoration: 'none' }}
          >
            {locale === 'de' ? 'Fragebogen' : 'Dotazník'}
          </Link>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={() => switchLocale('cs')} className="text-xs px-2.5 py-1 rounded-md border transition-colors" style={{ background: locale === 'cs' ? '#2a4f2d' : 'transparent', color: locale === 'cs' ? '#fff' : '#6b7280', borderColor: locale === 'cs' ? '#2a4f2d' : '#d1d5db' }}>🇨🇿 CS</button>
            <button onClick={() => switchLocale('de')} className="text-xs px-2.5 py-1 rounded-md border transition-colors" style={{ background: locale === 'de' ? '#2a4f2d' : 'transparent', color: locale === 'de' ? '#fff' : '#6b7280', borderColor: locale === 'de' ? '#2a4f2d' : '#d1d5db' }}>🇩🇪 DE</button>
          </div>
        </div>

        {/* Mobile: Dotazník + hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          <Link
            href={`${prefix}/dotaznik`}
            className="text-sm font-medium px-3 py-1.5 rounded-lg"
            style={{ background: '#2a4f2d', color: '#fff', textDecoration: 'none' }}
          >
            {locale === 'de' ? 'Fragebogen' : 'Dotazník'}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg" style={{ color: '#6b7280' }}>
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4">
          {navLinks.map(({ href, label, anchor }) =>
            anchor ? (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="text-sm text-gray-600" style={{ textDecoration: 'none' }}>
                {label}
              </a>
            ) : (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="text-sm text-gray-600" style={{ textDecoration: 'none' }}>
                {label}
              </Link>
            )
          )}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={() => switchLocale('cs')} className="text-xs px-3 py-1.5 rounded-md border transition-colors" style={{ background: locale === 'cs' ? '#2a4f2d' : 'transparent', color: locale === 'cs' ? '#fff' : '#6b7280', borderColor: locale === 'cs' ? '#2a4f2d' : '#d1d5db' }}>🇨🇿 CS</button>
            <button onClick={() => switchLocale('de')} className="text-xs px-3 py-1.5 rounded-md border transition-colors" style={{ background: locale === 'de' ? '#2a4f2d' : 'transparent', color: locale === 'de' ? '#fff' : '#6b7280', borderColor: locale === 'de' ? '#2a4f2d' : '#d1d5db' }}>🇩🇪 DE</button>
          </div>
        </div>
      )}
    </nav>
  )
}
