import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Handle language routing
  const segments = pathname.split('/')
  const firstSegment = segments[1]
  
  // Check if the first segment is a valid language code
  const validLanguages = ['en-us', 'az-az', 'ru-ru']
  const isValidLanguage = validLanguages.includes(firstSegment)
  
  // If no language in URL and not an API route, redirect to default language
  if (!isValidLanguage && !pathname.startsWith('/api') && pathname !== '/') {
    const defaultLang = 'en-us'
    const newUrl = new URL(`/${defaultLang}${pathname}`, req.url)
    return NextResponse.redirect(newUrl)
  }
  
  // If root path, redirect to default language
  if (pathname === '/') {
    const defaultLang = 'en-us'
    const newUrl = new URL(`/${defaultLang}`, req.url)
    return NextResponse.redirect(newUrl)
  }
  
  // Always allow access to login page and auth API routes
  if (pathname.includes('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Only check admin routes
  if (pathname.includes('/admin')) {
    try {
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET 
      })

      // If no token, redirect to login with language
      if (!token) {
        const lang = isValidLanguage ? firstSegment : 'en-us'
        const loginUrl = new URL(`/${lang}/login`, req.url)
        return NextResponse.redirect(loginUrl)
      }

      // If user is not admin, redirect to login with error and language
      if (token.role !== 'ADMIN') {
        const lang = isValidLanguage ? firstSegment : 'en-us'
        const loginUrl = new URL(`/${lang}/login?error=unauthorized`, req.url)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      console.error('Middleware error:', error)
      const lang = isValidLanguage ? firstSegment : 'en-us'
      const loginUrl = new URL(`/${lang}/login`, req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 