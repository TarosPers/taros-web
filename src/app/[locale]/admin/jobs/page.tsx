'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Job {
  id: string
  title_cs: string
  title_de: string
  location: string
  type: string
  active: boolean
  created_at: string
  slug: string
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    setJobs(data ?? [])
    setLoading(false)
  }

  const toggleActive = async (e: React.MouseEvent, id: string, active: boolean) => {
    e.stopPropagation()
    await supabase.from('jobs').update({ active: !active }).eq('id', id)
    loadJobs()
  }

  const deleteJob = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Opravdu smazat tento inzerát?')) return
    await supabase.from('jobs').delete().eq('id', id)
    loadJobs()
  }

  const typeLabels: Record<string, string> = {
    fulltime: 'Plný úvazek',
    parttime: 'Zkrácený',
    temporary: 'Dočasný',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Inzeráty</h1>
          <p className="text-sm text-gray-400 mt-0.5">{jobs.length} celkem</p>
        </div>
        <Link
          href="/admin/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#2a4f2d' }}
        >
          + Nový inzerát
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Načítám...</p>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm mb-4">Zatím žádné inzeráty</p>
          <Link href="/admin/jobs/new" className="text-sm font-medium" style={{ color: '#2a4f2d' }}>
            Přidat první inzerát →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Pozice (CS)</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Lokalita</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Typ</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Stav</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Přidáno</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => router.push(`/admin/jobs/${job.id}`)}
                >
                  <td className="px-5 py-3.5 font-medium" style={{ color: '#1a1a1a' }}>{job.title_cs}</td>
                  <td className="px-5 py-3.5 text-gray-500">{job.location}</td>
                  <td className="px-5 py-3.5 text-gray-500">{typeLabels[job.type] ?? job.type}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={(e) => toggleActive(e, job.id, job.active)}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                      style={{
                        background: job.active ? '#eaf3e8' : '#f5f5f5',
                        color: job.active ? '#2a4f2d' : '#9ca3af',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: job.active ? '#2a4f2d' : '#d1d5db' }} />
                      {job.active ? 'Aktivní' : 'Skrytý'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">
                    {new Date(job.created_at).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/jobs/${job.id}`} className="text-xs transition-colors" style={{ color: '#2a4f2d' }}>
                        Upravit
                      </Link>
                      <Link href={`/jobs/${job.slug}`} className="text-xs text-gray-400 hover:text-gray-600" target="_blank">
                        Zobrazit
                      </Link>
                      <button onClick={(e) => deleteJob(e, job.id)} className="text-xs text-red-400 hover:text-red-600">
                        Smazat
                      </button>
                    </div>
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