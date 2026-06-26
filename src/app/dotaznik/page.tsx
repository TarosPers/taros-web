import DotaznikForm from '@/components/ui/DotaznikForm'
import Link from 'next/link'
import Image from 'next/image'

export default function DotaznikPage() {
  return (
    <>
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-2">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Image
              src="/images/logo.png"
              alt="Taros Personalservice GmbH"
              width={140}
              height={45}
              style={{ objectFit: 'contain' }}
            />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/jobs" className="text-sm" style={{ color: '#6b7280', textDecoration: 'none' }}>
              Volné pozice
            </Link>
            <Link href="/about" className="text-sm" style={{ color: '#6b7280', textDecoration: 'none' }}>
              O nás
            </Link>
            <Link href="/contact" className="text-sm" style={{ color: '#6b7280', textDecoration: 'none' }}>
              Kontakt
            </Link>
            <Link
              href="/de/dotaznik"
              className="text-xs px-2.5 py-1 rounded-md border"
              style={{ color: '#6b7280', borderColor: '#d1d5db', textDecoration: 'none' }}
            >
              DE
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto">
        <div className="px-8 py-8" style={{ background: '#2a4f2d' }}>
          <h1 className="text-2xl font-bold text-white">Dotazník pro uchazeče</h1>
          <p className="text-white/70 text-sm mt-1">
            Vyplňte formulář a my se vám ozveme do 48 hodin.
          </p>
        </div>
        <div className="px-8 py-10">
          <DotaznikForm locale="cs" />
        </div>
      </main>
    </>
  )
}