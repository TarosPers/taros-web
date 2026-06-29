'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

const links = {
  cs: [
    { label: 'O nás', href: '/about' },
    { label: 'Pro firmy', href: '/for-companies' },
    { label: 'Volné pozice', href: '/jobs' },
    { label: 'Dotazník', href: '/dotaznik' },
    { label: 'Kontakt', href: '/contact' },
    { label: 'Impressum', href: '/imprint' },
    { label: 'Ochrana údajů', href: '/privacy' },
  ],
  de: [
    { label: 'Über uns', href: '/about' },
    { label: 'Für Unternehmen', href: '/for-companies' },
    { label: 'Stellenangebote', href: '/jobs' },
    { label: 'Fragebogen', href: '/dotaznik' },
    { label: 'Kontakt', href: '/contact' },
    { label: 'Impressum', href: '/imprint' },
    { label: 'Datenschutz', href: '/privacy' },
  ],
}

export default function Footer() {
  const locale = useLocale()
  const navLinks = links[locale as 'cs' | 'de'] ?? links.cs
  const prefix = locale === 'de' ? '/de' : ''

  return (
    <footer style={{ background: '#1e3d21' }} className="text-white mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">

          {/* Brand */}
          <div>
            <div className="mb-4">
              <img
                src="/images/logo.png"
                alt="Taros Personalservice"
                className="h-12 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              {locale === 'de'
                ? 'Ihr verlässlicher Partner für Arbeitsvermittlung.'
                : 'Váš spolehlivý partner pro zprostředkování práce.'}
            </p>
            <br></br>
            {/* Facebook */}
            <a
              href="https://www.facebook.com/tarospracevnemecku/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-white/50 hover:text-white transition-colors text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </a>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-4">
              {locale === 'de' ? 'Navigation' : 'Navigace'}
            </h3>
            <ul className="space-y-2">
              {navLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={`${prefix}${link.href}`}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-4">
              {locale === 'de' ? 'Kontakt' : 'Kontakt'}
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <span className="block text-white/40 text-xs uppercase tracking-wider mb-0.5">
                  {locale === 'de' ? 'Adresse' : 'Adresa'}
                </span>
                Dr.-Schott-Straße 49<br />
                94227 Zwiesel, Deutschland
              </li>
              <li>
                <span className="block text-white/40 text-xs uppercase tracking-wider mb-0.5">Telefon</span>
                <a href="tel:+4999228691234" className="hover:text-white transition-colors block">
                  09922 / 869 1234
                </a>
                <a href="tel:+420601506010" className="hover:text-white transition-colors block">
                  +420 601 506 010
                </a>
              </li>
              <li>
                <span className="block text-white/40 text-xs uppercase tracking-wider mb-0.5">Email</span>
                <a href="mailto:info@taros-personal.de" className="hover:text-white transition-colors">
                  info@taros-personal.de
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-white/30 text-xs">
          <span>© {new Date().getFullYear()} Taros Personalservice GmbH. {locale === 'de' ? 'Alle Rechte vorbehalten.' : 'Všechna práva vyhrazena.'}</span>
          <div className="flex gap-4">
            <Link href={`${prefix}/imprint`} className="hover:text-white/60 transition-colors">
              Impressum
            </Link>
            <Link href={`${prefix}/privacy`} className="hover:text-white/60 transition-colors">
              {locale === 'de' ? 'Datenschutz' : 'Ochrana údajů'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
