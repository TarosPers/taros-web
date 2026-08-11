'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Company {
  id: string
  name: string
}

export default function EditShiftWorkerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [active, setActive] = useState(true)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const [{ data: worker }, { data: allCompanies }, { data: links }] = await Promise.all([
        supabase.from('shift_workers').select('*').eq('id', params.id).single(),
        supabase.from('shift_companies').select('id, name').eq('active', true).order('name'),
        supabase.from('shift_worker_companies').select('company_id').eq('worker_id', params.id),
      ])

      if (worker) {
        setName(worker.name)
        setNote(worker.note ?? '')
        setActive(worker.active)
      }
      setCompanies(allCompanies ?? [])
      setSelectedCompanies((links ?? []).map(l => l.company_id))
      setLoading(false)
    }
    load()
  }, [params.id])

  const toggleCompany = (id: string) => {
    setSelectedCompanies(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('shift_workers').update({
      name,
      note: note || null,
      active,
    }).eq('id', params.id)

    if (error) {
      alert('Chyba při ukládání: ' + error.message)
      setSaving(false)
      return
    }

    await supabase.from('shift_worker_companies').delete().eq('worker_id', params.id)
    if (selectedCompanies.length > 0) {
      const rows = selectedCompanies.map(company_id => ({ worker_id: params.id, company_id }))
      const { error: linkError } = await supabase.from('shift_worker_companies').insert(rows)
      if (linkError) {
        alert('Pracovník uložen, ale nepodařilo se aktualizovat firmy: ' + linkError.message)
      }
    }

    router.push('/admin/shifts/workers')
  }

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Zpět</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Upravit pracovníka</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="mb-4">
            <label className="form-label">Jméno *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" required />
          </div>
          <div>
            <label className="form-label">Poznámka</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="form-input min-h-[70px] resize-none" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="form-label mb-2 block">Smí pracovat ve firmách</label>
          {companies.length === 0 ? (
            <p className="text-xs text-gray-400">Zatím nejsou žádné aktivní firmy.</p>
          ) : (
            <div className="space-y-2">
              {companies.map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(c.id)}
                    onChange={() => toggleCompany(c.id)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#2a4f2d' }}
                  />
                  <span className="text-sm text-gray-700">{c.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-green-700" />
            <span className="text-sm text-gray-600">Aktivní</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: '#2a4f2d' }}>
            {saving ? 'Ukládám...' : 'Uložit změny'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
            Zrušit
          </button>
        </div>
      </form>
    </div>
  )
}
