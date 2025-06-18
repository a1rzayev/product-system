'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthRedirect() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect if user is authenticated as admin and on a user page
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      // Define user-facing pages that should redirect to admin dashboard
      const userPages = ['/', '/products', '/categories']
      
      // Don't redirect if already on admin pages, login page, or API routes
      if (!pathname.startsWith('/admin') && 
          !pathname.startsWith('/api') && 
          pathname !== '/login' &&
          userPages.includes(pathname)) {
        console.log('Admin user detected on user page, redirecting to admin dashboard...')
        window.location.href = '/admin'
      }
    }
  }, [session, status, pathname])

  // This component doesn't render anything
  return null
} 