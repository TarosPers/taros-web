'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import RichEditor from '@/components/ui/RichEditor'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAGE_LABELS: Record<string, string> = {
  about:           'O nás',
  'for-companies': 'Pro firmy',
  contact:         'Kontakt',
  imprint:         'Impressum',
  privacy:         'Zásady ochrany osobních údajů',
}

export default function EditPagePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'cs' | 'de'>('cs')
  const [content_cs, setContentCs] = useState('')
  const [content_de, setContentDe] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('pages').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) {
        setContentCs(data.content_cs ?? '')
        setContentDe(data.content_de ?? '')
      }
      setLoading(false)
    })
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('pages').update({
      content_cs,
      content_de,
      updated_at: new Date().toISOString(),
    }).eq('id', params.id)
    setSaving(false)
    router.push('/admin/pages')
  }

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Zpět</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>
          {PAGE_LABELS[params.id] ?? params.id}
        </h1>
        <a
          href={`/${params.id}`}
          target="_blank"
          className="text-xs text-gray-400 hover:text-gray-600 ml-2"
        >
          Zobrazit →
        </a>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {/* Přepínač CS/DE */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab('cs')}
            className="text-xs px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: tab === 'cs' ? '#2a4f2d' : '#f5f5f5',
              color: tab === 'cs' ? '#fff' : '#6b7280',
            }}
          >
            🇨🇿 Česky
          </button>
          <button
            onClick={() => setTab('de')}
            className="text-xs px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: tab === 'de' ? '#2a4f2d' : '#f5f5f5',
              color: tab === 'de' ? '#fff' : '#6b7280',
            }}
          >
            🇩🇪 Deutsch
          </button>
        </div>

        {/* Editor */}
        {tab === 'cs' ? (
          <div>
            <label className="form-label mb-2 block">Obsah stránky – česky</label>
            <RichEditor
              value={content_cs}
              onChange={setContentCs}
              placeholder="Obsah stránky v češtině..."
            />
          </div>
        ) : (
          <div>
            <label className="form-label mb-2 block">Seiteninhalt – Deutsch</label>
            <RichEditor
              value={content_de}
              onChange={setContentDe}
              placeholder="Seiteninhalt auf Deutsch..."
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60"
          style={{ background: '#2a4f2d' }}
        >
          {saving ? 'Ukládám...' : 'Uložit stránku'}
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          Zrušit
        </button>
      </div>
    </div>
  )
}
