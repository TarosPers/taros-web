import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['cs', 'de'],
  defaultLocale: 'cs',
  localePrefix: 'as-needed',
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*|dotaznik).*)'],
}