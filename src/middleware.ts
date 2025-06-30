import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Always allow access to login page and auth API routes
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Only check admin routes
  if (pathname.startsWith('/admin')) {
    try {
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET 
      })

      // If no token, redirect to login
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      // Allow any authenticated user to access admin panel
      // Admin-specific features will be handled by individual API routes
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
} 