'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [workerName, setWorkerName] = useState('')

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (pathname.includes('/portal/login')) {
        setLoading(false)
        return
      }

      if (!session || session.user.user_metadata?.role !== 'worker') {
        router.push('/portal/login')
        return
      }

      const { data: worker } = await supabase
        .from('shift_workers')
        .select('name')
        .eq('auth_user_id', session.user.id)
        .single()

      setWorkerName(worker?.name ?? '')
      setLoading(false)
    }
    check()
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/portal/login')
  }

  if (pathname.includes('/portal/login')) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2f8f1' }}>
        <div className="text-sm text-gray-400">Načítám...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Taros" style={{ height: '28px', objectFit: 'contain' }} />
            <span className="text-sm text-gray-500">{workerName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            Odhlásit
          </button>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
