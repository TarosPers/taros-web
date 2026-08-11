'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const TABS = [
  { href: '/admin/shifts/companies', label: 'Firmy' },
  { href: '/admin/shifts/workers',   label: 'Pracovníci' },
]

export default function ShiftsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {TABS.map(({ href, label }) => {
          const active = pathname.includes(href)
          return (
            <Link
              key={href}
              href={href}
              className="text-sm px-4 py-2.5 border-b-2 transition-colors"
              style={{
                borderColor: active ? '#2a4f2d' : 'transparent',
                color: active ? '#2a4f2d' : '#6b7280',
                fontWeight: active ? 500 : 400,
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>
      {children}
    </div>
  )
}
