import { getLocale } from 'next-intl/server'
import { supabase } from '@/lib/supabase'
import StaticPage from '@/components/ui/StaticPage'

const PAGE_TITLES: Record<string, { cs: string; de: string }> = {
  about:          { cs: 'O nás',                    de: 'Über uns' },
  'for-companies': { cs: 'Pro firmy',               de: 'Für Unternehmen' },
  contact:        { cs: 'Kontakt',                  de: 'Kontakt' },
  imprint:        { cs: 'Impressum',                de: 'Impressum' },
  privacy:        { cs: 'Zásady ochrany osobních údajů', de: 'Datenschutzerklärung' },
}

export default async function Page() {
  const locale = await getLocale()
  const pageId = 'about'
  const { data } = await supabase.from('pages').select('*').eq('id', pageId).single()
  const titles = PAGE_TITLES[pageId]
  const title = locale === 'de' ? titles.de : titles.cs
  const content = locale === 'de' ? (data?.content_de ?? '') : (data?.content_cs ?? '')

  return <StaticPage title={title} content={content} />
}
