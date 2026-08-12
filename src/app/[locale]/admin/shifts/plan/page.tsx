'use client'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams } from 'next/navigation'
import ShiftPlanGrid from '@/components/admin/ShiftPlanGrid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Company {
  id: string
  name: string
}

function ShiftPlanPageInner() {
  const searchParams = useSearchParams()
  const preselected = searchParams.get('company')

  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('shift_companies').select('id, name').eq('active', true).order('name').then(({ data }) => {
      setCompanies(data ?? [])
      if (preselected && (data ?? []).some(c => c.id === preselected)) {
        setSelectedCompanyId(preselected)
      } else if ((data ?? []).length > 0) {
        setSelectedCompanyId(data![0].id)
      }
      setLoading(false)
    })
  }, [preselected])

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>

  return (
    <div>
      <h1 className="text-xl font-medium mb-4" style={{ color: '#1a1a1a' }}>Plánování směn</h1>

      {companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Zatím nejsou žádné aktivní firmy. Nejdřív založte firmu v sekci Firmy.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCompanyId(c.id)}
                className="text-sm px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap"
                style={{
                  borderColor: selectedCompanyId === c.id ? '#2a4f2d' : 'transparent',
                  color: selectedCompanyId === c.id ? '#2a4f2d' : '#6b7280',
                  fontWeight: selectedCompanyId === c.id ? 500 : 400,
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {selectedCompanyId && <ShiftPlanGrid companyId={selectedCompanyId} />}
        </>
      )}
    </div>
  )
}

export default function ShiftPlanPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Načítám...</div>}>
      <ShiftPlanPageInner />
    </Suspense>
  )
}
