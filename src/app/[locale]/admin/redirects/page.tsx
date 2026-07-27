'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Redirect {
  id: string
  from_path: string
  to_path: string
  active: boolean
  created_at: string
}

export default function AdminRedirectsPage() {
  const [items, setItems] = useState<Redirect[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fromPath, setFromPath] = useState('')
  const [toPath, setToPath] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from('redirects')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  const normalizePath = (p: string) => {
    let v = p.trim()
    if (!v) return v

    // Vložená celá URL s protokolem (https://...) → vezmi jen cestu
    if (/^https?:\/\//i.test(v)) {
      try {
        v = new URL(v).pathname
      } catch {
        // necháme beze změny, projde jako neplatné níž
      }
    } else if (!v.startsWith('/') && v.includes('.') && v.includes('/')) {
      // Doména bez protokolu, např. "www.taros-personal.cz/jobs/xxx"
      try {
        v = new URL('https://' + v).pathname
      } catch {
        // necháme beze změny
      }
    }

    if (!v.startsWith('/')) v = '/' + v
    if (v.length > 1 && v.endsWith('/')) v = v.slice(0, -1)
    return v
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const from = normalizePath(fromPath)
    const to = normalizePath(toPath)

    if (!from || !to) {
      setError('Vyplňte obě cesty.')
      return
    }
    if (from === to) {
      setError('Zdrojová a cílová cesta nemohou být stejné.')
      return
    }

    setSaving(true)
    const { error: err } = await supabase.from('redirects').insert({
      from_path: from,
      to_path: to,
      active: true,
    })

    if (err) {
      setError(err.code === '23505' ? 'Přesměrování z této cesty už existuje.' : 'Chyba při ukládání: ' + err.message)
      setSaving(false)
      return
    }

    setFromPath('')
    setToPath('')
    setSaving(false)
    load()
  }

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('redirects').update({ active: !active }).eq('id', id)
    load()
  }

  const deleteRedirect = async (id: string) => {
    if (!confirm('Opravdu smazat toto přesměrování?')) return
    await supabase.from('redirects').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Přesměrování</h1>
        <p className="text-sm text-gray-400 mt-0.5">{items.length} celkem</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Nové přesměrování</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1 w-full">
            <label className="form-label">Z cesty</label>
            <input
              value={fromPath}
              onChange={(e) => setFromPath(e.target.value)}
              className="form-input"
              placeholder="/jobs/stary-inzerat-1234"
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="form-label">Na cestu</label>
            <input
              value={toPath}
              onChange={(e) => setToPath(e.target.value)}
              className="form-input"
              placeholder="/jobs/novy-inzerat-5678"
              required
            />
          </div>
          <div className="w-full sm:w-auto sm:pt-6">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ background: '#2a4f2d' }}
            >
              {saving ? 'Ukládám...' : 'Přidat'}
            </button>
          </div>
        </form>
        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        {(fromPath || toPath) && !error && (
          <p className="text-xs text-gray-400 mt-3">
            Uloží se jako: <code className="text-gray-600">{normalizePath(fromPath) || '…'}</code> → <code className="text-gray-600">{normalizePath(toPath) || '…'}</code>
          </p>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Cesty zadávejte přesně tak, jak se objeví v adresním řádku, včetně případného <code>/de</code> na začátku (např. <code>/de/jobs/stary-slug</code>). Můžeš vložit i celou URL (např. z prohlížeče) — doména se automaticky odstraní.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Načítám...</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Zatím žádná přesměrování</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Z cesty</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Na cestu</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Stav</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: '#1a1a1a' }}>{r.from_path}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{r.to_path}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActive(r.id, r.active)}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                      style={{
                        background: r.active ? '#eaf3e8' : '#f5f5f5',
                        color: r.active ? '#2a4f2d' : '#9ca3af',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.active ? '#2a4f2d' : '#d1d5db' }} />
                      {r.active ? 'Aktivní' : 'Vypnuté'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => deleteRedirect(r.id)} className="text-xs text-red-400 hover:text-red-600">
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
