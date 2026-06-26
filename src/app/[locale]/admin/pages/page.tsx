'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

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

export default function AdminPagesPage() {
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('pages').select('*').then(({ data }) => {
      setPages(data ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Stránky</h1>
        <p className="text-sm text-gray-400 mt-0.5">Upravte obsah statických stránek webu</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Načítám...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Stránka</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">URL</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Upraveno</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-medium" style={{ color: '#1a1a1a' }}>
                    {PAGE_LABELS[page.id] ?? page.id}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">/{page.id}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {page.updated_at ? new Date(page.updated_at).toLocaleDateString('cs-CZ') : '–'}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/pages/${page.id}`} className="text-xs" style={{ color: '#2a4f2d' }}>
                      Upravit
                    </Link>
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
