'use client'
import { useLocale } from 'next-intl'
import Link from 'next/link'

interface Job {
  id: string
  slug: string
  title_cs: string
  title_de: string
  location: string
  salary_range: string | null
  type: string
  active: boolean
  og_image_url: string | null
  og_image_url_de: string | null
}

const TAG_STYLES: Record<string, { bg: string; color: string; label: string; labelDe: string }> = {
  fulltime:  { bg: '#eaf3e8', color: '#2a4f2d', label: 'Plný úvazek',     labelDe: 'Vollzeit' },
  parttime:  { bg: '#f5f5f5', color: '#6b7280', label: 'Zkrácený úvazek', labelDe: 'Teilzeit' },
  temporary: { bg: '#fef3e6', color: '#e07b0a', label: 'Dočasný',          labelDe: 'Zeitarbeit' },
}

export default function JobCard({ job }: { job: Job }) {
  const locale = useLocale()
  const title = locale === 'de' ? job.title_de : job.title_cs
  const imageUrl = (locale === 'de' && job.og_image_url_de) ? job.og_image_url_de : job.og_image_url
  const tag = TAG_STYLES[job.type] ?? TAG_STYLES.fulltime
  const tagLabel = locale === 'de' ? tag.labelDe : tag.label

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="flex bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all no-underline group"
      style={{ textDecoration: 'none', minHeight: '180px' }}
    >
      {/* Obrázek vlevo - 50% */}
      <div className="flex-shrink-0 overflow-hidden" style={{ width: '50%' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full transition-transform duration-300 group-hover:scale-105"
            style={{ objectFit: 'cover', background: '#f9fafb' }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2a4f2d 0%, #3a6b3d 100%)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
        )}
      </div>

      {/* Obsah vpravo - 50% */}
      <div className="flex flex-col justify-between p-5" style={{ width: '50%' }}>
        <div>
          <span
            className="inline-block text-xs px-2.5 py-0.5 rounded-full mb-3 font-medium"
            style={{ background: tag.bg, color: tag.color }}
          >
            {tagLabel}
          </span>
          <h3 className="text-base font-semibold mb-3 leading-snug group-hover:underline" style={{ color: '#1a1a1a' }}>
            {title}
          </h3>
          <div className="flex flex-col gap-1.5 text-sm text-gray-500">
            <span>📍 {job.location}</span>
            {job.salary_range && <span>💶 {job.salary_range}</span>}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-300">CS · DE</span>
          <span className="text-sm transition-transform group-hover:translate-x-0.5" style={{ color: '#e07b0a' }}>→</span>
        </div>
      </div>
    </Link>
  )
}
