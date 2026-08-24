'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PortalLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError || !data.user) {
      setError('Nesprávný e-mail nebo heslo.')
      setLoading(false)
      return
    }

    if (data.user.user_metadata?.role !== 'worker') {
      await supabase.auth.signOut()
      setError('Tento účet nemá přístup do portálu pro pracovníky.')
      setLoading(false)
      return
    }

    router.push('/portal')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f2f8f1' }}>
      <div className="w-full max-w-sm bg-white rounded-xl border border-gray-100 p-8">
        <div className="flex justify-center mb-6">
          <img src="/images/logo.png" alt="Taros" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
        <h1 className="text-lg font-medium text-center mb-6" style={{ color: '#1a1a1a' }}>Portál pro pracovníky</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="form-label">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: '#2a4f2d' }}
          >
            {loading ? 'Přihlašuji...' : 'Přihlásit se'}
          </button>
        </form>
      </div>
    </div>
  )
}
