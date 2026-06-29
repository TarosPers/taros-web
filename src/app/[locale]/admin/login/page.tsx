'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const t = {
  cs: {
    title: 'Admin přihlášení',
    subtitle: 'Správa inzerátů a žadatelů',
    email: 'E-mail',
    password: 'Heslo',
    submit: 'Přihlásit se',
    submitting: 'Přihlašuji...',
    error: 'Nesprávný email nebo heslo',
  },
  de: {
    title: 'Admin-Anmeldung',
    subtitle: 'Verwaltung von Stellenangeboten und Bewerbern',
    email: 'E-Mail',
    password: 'Passwort',
    submit: 'Anmelden',
    submitting: 'Anmeldung läuft...',
    error: 'Falsche E-Mail oder falsches Passwort',
  },
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'cs' | 'de'>('cs')
  const router = useRouter()

  useEffect(() => {
    // Po přihlášení zjistíme jazyk z user metadata
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.lang) {
        setLang(user.user_metadata.lang as 'cs' | 'de')
      }
    })
  }, [])

  const tr = t[lang]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(tr.error)
      setLoading(false)
    } else {
      // Po přihlášení nastavíme jazyk podle user metadata
      const userLang = data.user?.user_metadata?.lang ?? 'cs'
      setLang(userLang as 'cs' | 'de')
      router.push('/admin/jobs')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2f8f1' }}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src="/images/logo.png" alt="Taros" style={{ height: '48px', objectFit: 'contain' }} />
        </div>
        <h1 className="text-xl font-medium text-center mb-1" style={{ color: '#1a1a1a' }}>{tr.title}</h1>
        <p className="text-sm text-gray-400 text-center mb-8">{tr.subtitle}</p>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">{tr.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="admin@taros-personal.de"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs text-gray-500 mb-1">{tr.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
            style={{ background: '#2a4f2d' }}
          >
            {loading ? tr.submitting : tr.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
