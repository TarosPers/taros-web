'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AdminUser {
  id: string
  email: string
  role: string
  created_at: string
  last_sign_in_at: string | null
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    if (data.users) setUsers(data.users)
    setLoading(false)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setMessage('')

    const res = await fetch('/api/admin/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    const data = await res.json()

    if (data.ok) {
      setMessage(`Pozvánka odeslána na ${inviteEmail}`)
      setInviteEmail('')
      loadUsers()
    } else {
      setMessage('Chyba: ' + (data.error || 'Nepodařilo se pozvat uživatele'))
    }
    setInviting(false)
  }

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Opravdu smazat uživatele ${email}?`)) return

    const res = await fetch('/api/admin/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()

    if (data.ok) {
      setMessage(`Uživatel ${email} byl smazán`)
      loadUsers()
    } else {
      setMessage('Chyba: ' + (data.error || 'Nepodařilo se smazat uživatele'))
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium mb-6" style={{ color: '#1a1a1a' }}>Správa uživatelů</h1>

      {/* Pozvání nového admina */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Pozvat nového uživatele</h2>
        <form onSubmit={handleInvite} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">E-mail</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="form-input"
              placeholder="novy@taros-personal.de"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="form-input"
              style={{ minWidth: '130px' }}
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: '#2a4f2d' }}
          >
            {inviting ? 'Odesílám...' : 'Pozvat'}
          </button>
        </form>
        {message && (
          <p className={`text-xs mt-3 ${message.startsWith('Chyba') ? 'text-red-500' : 'text-green-700'}`}>
            {message}
          </p>
        )}
      </div>

      {/* Seznam uživatelů */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Uživatelé</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Načítám...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-medium pb-2">E-mail</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-2">Role</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-2">Poslední přihlášení</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50">
                  <td className="py-3 text-gray-700">{user.email}</td>
                  <td className="py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: user.role === 'superadmin' ? '#fef3e6' : '#eaf3e8',
                        color: user.role === 'superadmin' ? '#e07b0a' : '#2a4f2d',
                      }}
                    >
                      {user.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400 text-xs">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString('cs-CZ')
                      : 'Nikdy'}
                  </td>
                  <td className="py-3 text-right">
                    {user.role !== 'superadmin' && (
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Smazat
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
