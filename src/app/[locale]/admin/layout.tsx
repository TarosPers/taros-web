'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const t = {
  cs: {
    jobs: 'Inzeráty',
    applicants: 'Žadatelé',
    pages: 'Stránky',
    questionnaires: 'Dotazníky',
    redirects: 'Přesměrování',
    planning: 'Plánování',
    planningPlan: 'Plánovat',
    planningCompanies: 'Firmy',
    planningWorkers: 'Zaměstnanci',
    system: 'Systém',
    users: 'Uživatelé',
    web: '← Web',
    logout: 'Odhlásit',
    loading: 'Načítám...',
  },
  de: {
    jobs: 'Stellenangebote',
    applicants: 'Bewerber',
    pages: 'Seiten',
    questionnaires: 'Fragebögen',
    redirects: 'Weiterleitungen',
    planning: 'Planung',
    planningPlan: 'Planen',
    planningCompanies: 'Unternehmen',
    planningWorkers: 'Mitarbeiter',
    system: 'System',
    users: 'Benutzer',
    web: '← Website',
    logout: 'Abmelden',
    loading: 'Laden...',
  },
}

function DropdownNav({
  label,
  items,
  active,
  pathname,
}: {
  label: string
  items: { href: string; label: string }[]
  active: boolean
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (items.length === 0) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="text-sm transition-colors flex items-center gap-1"
        style={{
          color: active ? '#2a4f2d' : '#6b7280',
          fontWeight: active ? 500 : 400,
        }}
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-2 bg-white rounded-lg border border-gray-100 py-1.5 z-50"
          style={{ minWidth: '160px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        >
          {items.map(({ href, label: itemLabel }) => (
            <Link
              key={href}
              href={href}
              className="block px-4 py-2 text-sm transition-colors"
              style={{
                color: pathname.includes(href) ? '#2a4f2d' : '#6b7280',
                fontWeight: pathname.includes(href) ? 500 : 400,
                background: pathname.includes(href) ? '#f2f8f1' : 'transparent',
              }}
            >
              {itemLabel}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [lang, setLang] = useState<'cs' | 'de'>('cs')
  // null = bez omezení (vidí vše, jako doteď); pole = jen vyjmenované sekce
  const [permissions, setPermissions] = useState<string[] | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !pathname.includes('/login')) {
        router.push('/admin/login')
      }
      if (session?.user?.user_metadata?.role === 'superadmin') {
        setIsSuperadmin(true)
      }
      const userLang = session?.user?.user_metadata?.lang ?? 'cs'
      setLang(userLang as 'cs' | 'de')
      const userPermissions = session?.user?.user_metadata?.permissions
      setPermissions(Array.isArray(userPermissions) ? userPermissions : null)
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const tr = t[lang]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2f8f1' }}>
        <div className="text-sm text-gray-400">{tr.loading}</div>
      </div>
    )
  }

  if (pathname.includes('/login')) {
    return <>{children}</>
  }

  // Superadmin vidí vždy vše, bez ohledu na permissions. Jinak: null = bez omezení, jinak filtrujeme podle klíče.
  const canSee = (key: string) => isSuperadmin || permissions === null || permissions.includes(key)

  const navItems = [
    { href: '/admin/jobs',            label: tr.jobs,           key: 'jobs' },
    { href: '/admin/applicants',      label: tr.applicants,     key: 'applicants' },
    { href: '/admin/questionnaires',  label: tr.questionnaires, key: 'questionnaires' },
    { href: '/admin/redirects',       label: tr.redirects,      key: 'redirects' },
  ].filter(item => canSee(item.key))

  const planningItems = [
    { href: '/admin/shifts/plan',      label: tr.planningPlan },
    { href: '/admin/shifts/companies', label: tr.planningCompanies },
    { href: '/admin/shifts/workers',   label: tr.planningWorkers },
  ]
  const isPlanningActive = pathname.includes('/admin/shifts')

  const systemItems = [
    ...(canSee('pages') ? [{ href: '/admin/pages', label: tr.pages }] : []),
    ...(isSuperadmin ? [{ href: '/admin/users', label: tr.users }] : []),
  ]
  const isSystemActive = pathname.includes('/admin/pages') || pathname.includes('/admin/users')

  const isPlanPage = pathname.includes('/admin/shifts/plan')

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src="/images/logo.png" alt="Taros" style={{ height: '32px', objectFit: 'contain' }} />
            <span className="text-xs font-medium px-2 py-1 rounded" style={{ background: '#f2f8f1', color: '#2a4f2d' }}>
              {isSuperadmin ? 'Superadmin' : 'Admin'}
            </span>
            <div className="flex items-center gap-6">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm transition-colors"
                  style={{
                    color: pathname.includes(href) ? '#2a4f2d' : '#6b7280',
                    fontWeight: pathname.includes(href) ? 500 : 400,
                  }}
                >
                  {label}
                </Link>
              ))}

              {canSee('planning') && (
                <DropdownNav label={tr.planning} items={planningItems} active={isPlanningActive} pathname={pathname} />
              )}
              {systemItems.length > 0 && (
                <DropdownNav label={tr.system} items={systemItems} active={isSystemActive} pathname={pathname} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
              {tr.web}
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {tr.logout}
            </button>
          </div>
        </div>
      </nav>
      <main className={isPlanPage ? 'w-full px-4 py-8' : 'max-w-7xl mx-auto px-8 py-8'}>{children}</main>
    </div>
  )
}
