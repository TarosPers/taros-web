'use client'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    const isInvite = hash.includes('type=invite')

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        if (isInvite) {
          router.push('/auth/set-password')
        } else {
          router.push('/admin/jobs')
        }
      }
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2f8f1' }}>
      <div className="text-center">
        <img src="/images/logo.png" alt="Taros" style={{ height: '48px', objectFit: 'contain', margin: '0 auto 24px' }} />
        <p className="text-sm text-gray-400">Přihlašuji...</p>
      </div>
    </div>
  )
}
