'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthRedirect() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    // Check if we're in the process of logging out
    if (status === 'loading') {
      return
    }

    // If not authenticated, don't redirect
    if (status === 'unauthenticated') {
      setIsLoggingOut(false)
      return
    }

    // Only redirect if user is authenticated as admin and on a user page
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      // Define user-facing pages that should redirect to admin dashboard
      const userPages = ['/', '/products', '/categories']
      
      // Don't redirect if already on admin pages, login page, or API routes
      if (!pathname.startsWith('/admin') && 
          !pathname.startsWith('/api') && 
          pathname !== '/login' &&
          userPages.includes(pathname) &&
          !isLoggingOut) {
        console.log('Admin user detected on user page, redirecting to admin dashboard...')
        window.location.href = '/admin'
      }
    }
  }, [session, status, pathname, isLoggingOut])

  // Listen for logout events
  useEffect(() => {
    const handleBeforeUnload = () => {
      setIsLoggingOut(true)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // This component doesn't render anything
  return null
} 