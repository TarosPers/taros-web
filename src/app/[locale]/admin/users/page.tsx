'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AdminUser {
  id: string
  email: string
  role: string
  lang: string
  created_at: string
  last_sign_in_at: string | null
}

const t = {
  cs: {
    title: 'Správa uživatelů',
    invite: 'Pozvat nového uživatele',
    email: 'E-mail',
    role: 'Role',
    lang: 'Jazyk administrace',
    btnInvite: 'Pozvat',
    inviting: 'Odesílám...',
    users: 'Uživatelé',
    lastLogin: 'Poslední přihlášení',
    never: 'Nikdy',
    delete: 'Smazat',
    confirmDelete: 'Opravdu smazat uživatele',
    loading: 'Načítám...',
    profile: 'Můj profil',
    profileLang: 'Jazyk administrace',
    profileSave: 'Uložit',
    profileSaving: 'Ukládám...',
    profileSaved: 'Uloženo',
  },
  de: {
    title: 'Benutzerverwaltung',
    invite: 'Neuen Benutzer einladen',
    email: 'E-Mail',
    role: 'Rolle',
    lang: 'Verwaltungssprache',
    btnInvite: 'Einladen',
    inviting: 'Wird gesendet...',
    users: 'Benutzer',
    lastLogin: 'Letzte Anmeldung',
    never: 'Nie',
    delete: 'Löschen',
    confirmDelete: 'Benutzer wirklich löschen',
    loading: 'Laden...',
    profile: 'Mein Profil',
    profileLang: 'Verwaltungssprache',
    profileSave: 'Speichern',
    profileSaving: 'Speichere...',
    profileSaved: 'Gespeichert',
  },
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [inviteLang, setInviteLang] = useState('cs')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState('')
  const [currentLang, setCurrentLang] = useState<'cs' | 'de'>('cs')
  const [profileLang, setProfileLang] = useState<'cs' | 'de'>('cs')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  const tr = t[currentLang]

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const lang = (user?.user_metadata?.lang ?? 'cs') as 'cs' | 'de'
      setCurrentLang(lang)
      setProfileLang(lang)
    })
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
      body: JSON.stringify({ email: inviteEmail, role: inviteRole, lang: inviteLang }),
    })
    const data = await res.json()

    if (data.ok) {
      setMessage(`✓ ${inviteEmail}`)
      setInviteEmail('')
      loadUsers()
    } else {
      setMessage('Chyba: ' + (data.error || ''))
    }
    setInviting(false)
  }

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`${tr.confirmDelete} ${email}?`)) return

    const res = await fetch('/api/admin/users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (data.ok) {
      setMessage(`✓ ${email}`)
      loadUsers()
    } else {
      setMessage('Chyba: ' + (data.error || ''))
    }
  }

  const handleProfileSave = async () => {
    setProfileSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { lang: profileLang },
    })
    if (!error) {
      setCurrentLang(profileLang)
      setProfileMessage(tr.profileSaved)
      setTimeout(() => setProfileMessage(''), 2000)
    }
    setProfileSaving(false)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>{tr.title}</h1>

      {/* Můj profil */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>{tr.profile}</h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{tr.profileLang}</label>
            <select
              value={profileLang}
              onChange={(e) => setProfileLang(e.target.value as 'cs' | 'de')}
              className="form-input"
              style={{ minWidth: '160px' }}
            >
              <option value="cs">Čeština</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          <button
            onClick={handleProfileSave}
            disabled={profileSaving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: '#2a4f2d' }}
          >
            {profileSaving ? tr.profileSaving : tr.profileSave}
          </button>
          {profileMessage && <span className="text-xs text-green-700">{profileMessage}</span>}
        </div>
      </div>

      {/* Pozvání */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>{tr.invite}</h2>
        <form onSubmit={handleInvite} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-500 mb-1">{tr.email}</label>
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
            <label className="block text-xs text-gray-500 mb-1">{tr.role}</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="form-input" style={{ minWidth: '130px' }}>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{tr.lang}</label>
            <select value={inviteLang} onChange={(e) => setInviteLang(e.target.value)} className="form-input" style={{ minWidth: '130px' }}>
              <option value="cs">Čeština</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
            style={{ background: '#2a4f2d' }}
          >
            {inviting ? tr.inviting : tr.btnInvite}
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
        <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>{tr.users}</h2>
        {loading ? (
          <p className="text-sm text-gray-400">{tr.loading}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-medium pb-2">{tr.email}</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-2">{tr.role}</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-2">{tr.lang}</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-2">{tr.lastLogin}</th>
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
                    {user.lang === 'de' ? 'Deutsch' : 'Čeština'}
                  </td>
                  <td className="py-3 text-gray-400 text-xs">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString('cs-CZ')
                      : tr.never}
                  </td>
                  <td className="py-3 text-right">
                    {user.role !== 'superadmin' && (
                      <button
                        onClick={() => handleDelete(user.id, user.email)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        {tr.delete}
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
