'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession()

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      window.location.href = '/admin'
    }
  }, [session, status])

  // Show loading for admin users
  if (status === 'loading' || (status === 'authenticated' && session?.user?.role === 'ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting to admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Product System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A comprehensive e-commerce product management system
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Management</h3>
            <p className="text-gray-600">
              Full CRUD operations for products with variants, images, and inventory tracking.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-4">🏷️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Category System</h3>
            <p className="text-gray-600">
              Hierarchical categories with parent-child relationships for organized product catalog.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Management</h3>
            <p className="text-gray-600">
              Complete order lifecycle with status tracking and customer management.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
            <div className="text-left space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">1. Database Setup</h3>
                <p className="text-gray-600 text-sm">
                  Run <code className="bg-gray-100 px-2 py-1 rounded">npm run db:generate</code> and <code className="bg-gray-100 px-2 py-1 rounded">npm run db:seed</code>
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">2. Admin Access</h3>
                <p className="text-gray-600 text-sm">
                  Login with <strong>admin@mail.com</strong> / <strong>admin123</strong>
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">3. Start Managing</h3>
                <p className="text-gray-600 text-sm">
                  Add products, categories, and manage your inventory through the admin panel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
