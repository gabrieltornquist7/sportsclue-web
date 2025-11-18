import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const locales = ['en', 'ar', 'de', 'es', 'fr', 'sv']
const defaultLocale = 'en'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // STEP 1: Supabase Auth - Refresh session (only if env vars are available)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                request.cookies.set(name, value)
              )
              response = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      // Refresh session if expired - required for Server Components
      await supabase.auth.getUser()
    } catch (error) {
      // Log error but don't crash the middleware
      console.error('Middleware auth error:', error)
    }
  }

  // STEP 2: Locale handling
  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return response
  }

  // Redirect root to default locale
  if (pathname === '/') {
    const locale = defaultLocale
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}/login`
    return NextResponse.redirect(url)
  }

  // For other paths without locale, add default locale
  const locale = defaultLocale
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
