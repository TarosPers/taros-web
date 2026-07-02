
'use client'

import DotaznikForm from '@/components/ui/DotaznikForm'
import Navbar from '@/components/ui/Navbar'
import Footer from '@/components/ui/Footer'

export default function DotaznikPage() {
  return (
    <>
      <Navbar />
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
      <Footer />
    </>
  )
}
