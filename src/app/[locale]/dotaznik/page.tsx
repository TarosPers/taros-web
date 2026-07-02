import { getLocale } from 'next-intl/server'
import DotaznikForm from '@/components/ui/DotaznikForm'
import Navbar from '@/components/ui/Navbar'

export default async function DotaznikPage() {
  const locale = await getLocale()

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto">
        <div className="px-8 py-8" style={{ background: '#2a4f2d' }}>
          <h1 className="text-2xl font-bold text-white">
            {locale === 'de' ? 'Fragebogen für Bewerber' : 'Dotazník pro uchazeče'}
          </h1>
          <p className="text-white/70 text-sm mt-1">
            {locale === 'de'
              ? 'Füllen Sie das Formular aus und wir melden uns innerhalb von 48 Stunden.'
              : 'Vyplňte formulář a my se vám ozveme do 48 hodin.'}
          </p>
        </div>
        <div className="px-8 py-10">
          <DotaznikForm locale={locale} />
        </div>
      </main>
    </>
  )
}
