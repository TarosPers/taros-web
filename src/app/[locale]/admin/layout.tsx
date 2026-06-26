'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !pathname.includes('/login')) {
        router.push('/admin/login')
      }
      setLoading(false)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2f8f1' }}>
        <div className="text-sm text-gray-400">Načítám...</div>
      </div>
    )
  }

  if (pathname.includes('/login')) {
    return <>{children}</>
  }

  const navItems = [
    { href: '/admin/jobs',       label: 'Inzeráty' },
    { href: '/admin/applicants', label: 'Žadatelé' },
    { href: "/admin/pages", label: "Stránky" },
    { href: "/admin/questionnaires", label: "Dotazníky" },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src="/images/logo.png" alt="Taros" style={{ height: '32px', objectFit: 'contain' }} />
            <span className="text-xs font-medium px-2 py-1 rounded" style={{ background: '#f2f8f1', color: '#2a4f2d' }}>
              Admin
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
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
              ← Web
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Odhlásit
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-8 py-8">{children}</main>
    </div>
  )
}
