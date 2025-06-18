import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'ADMIN'
    const pathname = req.nextUrl.pathname

    // Allow access to login and error pages without any checks
    if (pathname === '/admin/login' || pathname === '/admin/error') {
      return NextResponse.next()
    }

    // For all other admin routes, check if user is admin
    if (pathname.startsWith('/admin')) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Always allow access to login and error pages
        if (req.nextUrl.pathname === '/admin/login' || req.nextUrl.pathname === '/admin/error') {
          return true
        }
        // For other admin routes, require authentication
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token
        }
        return true
      }
    }
  }
)

export const config = {
  matcher: ['/admin/:path*']
} 