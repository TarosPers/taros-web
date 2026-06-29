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
    title: 'Nastavte heslo',
    subtitle: 'Zvolte heslo pro přístup do administrace',
    password: 'Heslo',
    confirm: 'Potvrdit heslo',
    placeholder: 'Minimálně 8 znaků',
    placeholderConfirm: 'Zopakujte heslo',
    save: 'Uložit heslo a přihlásit se',
    saving: 'Ukládám...',
    errorLength: 'Heslo musí mít alespoň 8 znaků',
    errorMatch: 'Hesla se neshodují',
    errorGeneral: 'Chyba: ',
  },
  de: {
    title: 'Passwort festlegen',
    subtitle: 'Wählen Sie ein Passwort für den Zugang zur Administration',
    password: 'Passwort',
    confirm: 'Passwort bestätigen',
    placeholder: 'Mindestens 8 Zeichen',
    placeholderConfirm: 'Passwort wiederholen',
    save: 'Passwort speichern und anmelden',
    saving: 'Speichere...',
    errorLength: 'Das Passwort muss mindestens 8 Zeichen lang sein',
    errorMatch: 'Die Passwörter stimmen nicht überein',
    errorGeneral: 'Fehler: ',
  },
}

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [lang, setLang] = useState<'cs' | 'de'>('cs')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const userLang = user?.user_metadata?.lang ?? 'cs'
      setLang(userLang as 'cs' | 'de')
    })
  }, [])

  const tr = t[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError(tr.errorLength)
      return
    }
    if (password !== confirm) {
      setError(tr.errorMatch)
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(tr.errorGeneral + error.message)
      setSaving(false)
    } else {
      window.location.href = '/admin/jobs'
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

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">{tr.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder={tr.placeholder}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs text-gray-500 mb-1">{tr.confirm}</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="form-input"
              placeholder={tr.placeholderConfirm}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
            style={{ background: '#2a4f2d' }}
          >
            {saving ? tr.saving : tr.save}
          </button>
        </form>
      </div>
    </div>
  )
}
