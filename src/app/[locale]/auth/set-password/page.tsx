'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků')
      return
    }
    if (password !== confirm) {
      setError('Hesla se neshodují')
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Chyba: ' + error.message)
      setSaving(false)
    } else {
      router.push('/admin/jobs')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f2f8f1' }}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src="/images/logo.png" alt="Taros" style={{ height: '48px', objectFit: 'contain' }} />
        </div>
        <h1 className="text-xl font-medium text-center mb-1" style={{ color: '#1a1a1a' }}>Nastavte heslo</h1>
        <p className="text-sm text-gray-400 text-center mb-8">Zvolte heslo pro přístup do administrace</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Minimálně 8 znaků"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs text-gray-500 mb-1">Potvrdit heslo</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="form-input"
              placeholder="Zopakujte heslo"
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
            {saving ? 'Ukládám...' : 'Uložit heslo a přihlásit se'}
          </button>
        </form>
      </div>
    </div>
  )
}
