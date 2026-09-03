import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import Footer from '@/components/ui/Footer'
import MetaPixel from '@/components/MetaPixel'
import '../globals.css'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  title: 'Taros Personalservice – Práce v Německu',
  description: 'Personální agentura pro práci v Německu. Férové podmínky, německá smlouva, osobní přístup.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <MetaPixel />
        <NextIntlClientProvider messages={messages}>
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
