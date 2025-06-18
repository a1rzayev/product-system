'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function AdminDashboard() {
  const { t } = useLanguage()

  const stats = [
    {
      name: t('products.title'),
      value: '0',
      icon: '📦',
      color: 'bg-blue-500'
    },
    {
      name: t('categories.title'),
      value: '0',
      icon: '🏷️',
      color: 'bg-green-500'
    },
    {
      name: t('orders.title'),
      value: '0', 
      icon: '📋',
      color: 'bg-yellow-500'
    },
    {
      name: t('users.title'),
      value: '0', 
      icon: '👥',
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
        <p className="text-gray-600">{t('auth.welcome')} {t('admin.dashboard').toLowerCase()}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('common.actions')}</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/products/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">➕</span>
              <div>
                <h3 className="font-medium text-gray-900">{t('products.addProduct')}</h3>
                <p className="text-sm text-gray-600">{t('products.addProduct')}</p>
              </div>
            </Link>
            <Link
              href="/admin/categories/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">🏷️</span>
              <div>
                <h3 className="font-medium text-gray-900">{t('categories.addCategory')}</h3>
                <p className="text-sm text-gray-600">{t('categories.addCategory')}</p>
              </div>
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">📋</span>
              <div>
                <h3 className="font-medium text-gray-900">{t('orders.title')}</h3>
                <p className="text-sm text-gray-600">{t('orders.title')}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('common.actions')}</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-8">
            <p>{t('common.loading')}</p>
            <p className="text-sm">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 