'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import CustomerAdminSidebar from '@/components/customer-admin/CustomerAdminSidebar'
import CustomerAdminHeader from '@/components/customer-admin/CustomerAdminHeader'

export default function CustomerAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Only allow CUSTOMER role to access customer admin
    if (session.user?.role !== 'CUSTOMER') {
      router.push('/')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role !== 'CUSTOMER') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerAdminHeader />
      <div className="flex">
        <CustomerAdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 