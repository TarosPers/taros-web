import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['cs', 'de'],
  defaultLocale: 'cs',
  localePrefix: 'as-needed',
})

async function findRedirect(pathname: string): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) return null

    const res = await fetch(
      `${supabaseUrl}/rest/v1/redirects?from_path=eq.${encodeURIComponent(pathname)}&active=eq.true&select=to_path&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        next: { revalidate: 60 },
      }
    )
    if (!res.ok) return null
    const rows = await res.json()
    return rows?.[0]?.to_path ?? null
  } catch {
    return null
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hostname = req.headers.get('host') ?? ''

  const target = await findRedirect(pathname)
  if (target) {
    return NextResponse.redirect(new URL(target, req.url), 301)
  }

  if (hostname.startsWith('app.')) {
    const url = req.nextUrl.clone()
    const alreadyHasPortalPrefix = pathname === '/portal' || pathname.startsWith('/portal/')
    const rest = alreadyHasPortalPrefix
      ? pathname.slice('/portal'.length)
      : (pathname === '/' ? '' : pathname)
    url.pathname = `/cs/portal${rest}`
    return NextResponse.rewrite(url)
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const url = req.nextUrl.clone()
    url.pathname = `/cs${pathname}`
    return NextResponse.redirect(url)
  }

  if (pathname === '/portal' || pathname.startsWith('/portal/')) {
    const url = req.nextUrl.clone()
    url.pathname = `/cs${pathname}`
    return NextResponse.rewrite(url)
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}