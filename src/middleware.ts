import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'ADMIN'
    const pathname = req.nextUrl.pathname

    // Allow access to login page without any checks
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // For all other admin routes, check if user is admin
    if (pathname.startsWith('/admin')) {
      if (!token) {
        // No token, redirect to login
        return NextResponse.redirect(new URL('/admin/login', req.url))
      }
      
      if (!isAdmin) {
        // User is authenticated but not admin, redirect to login with error
        return NextResponse.redirect(new URL('/admin/login?error=unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Always allow access to login page
        if (req.nextUrl.pathname === '/admin/login') {
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