'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Home() {
  const { data: session, status } = useSession()
  const { t } = useLanguage()

  // Redirect admin and customer users to their respective dashboards
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'ADMIN') {
        window.location.href = '/admin'
      } else if (session.user.role === 'CUSTOMER') {
        window.location.href = '/customer'
      }
    }
  }, [session, status])

  // Show loading for admin and customer users
  if (status === 'loading' || (status === 'authenticated' && (session?.user?.role === 'ADMIN' || session?.user?.role === 'CUSTOMER'))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('home.welcome')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('home.description')}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('products.title')}</h3>
            <p className="text-gray-600">
              Full CRUD operations for products with variants, images, and inventory tracking.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-4">🏷️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('categories.title')}</h3>
            <p className="text-gray-600">
              Hierarchical categories with parent-child relationships for organized product catalog.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('orders.title')}</h3>
            <p className="text-gray-600">
              Complete order lifecycle with status tracking and customer management.
            </p>
          </div>
        </div>

        
      </div>
    </div>
  )
}
