import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import Navbar from '@/components/ui/Navbar'
import Footer from '@/components/ui/Footer'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  title: 'Dotazník pro uchazeče | Taros Personalservice',
}

export default async function DotaznikLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()

  return (
    <html lang="cs">
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
