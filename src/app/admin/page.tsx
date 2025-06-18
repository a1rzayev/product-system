'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Stats {
  products: number
  categories: number
  orders: number
  users: number
}

export default function AdminDashboard() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<Stats>({ products: 0, categories: 0, orders: 0, users: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statsData = [
    {
      name: t('products.title'),
      value: stats.products,
      icon: '📦',
      color: 'bg-blue-500'
    },
    {
      name: t('categories.title'),
      value: stats.categories,
      icon: '🏷️',
      color: 'bg-green-500'
    },
    {
      name: t('orders.title'),
      value: stats.orders, 
      icon: '📋',
      color: 'bg-yellow-500'
    },
    {
      name: t('users.title'),
      value: stats.users, 
      icon: '👥',
      color: 'bg-purple-500'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
          <p className="text-gray-600">{t('auth.welcome')} {t('admin.dashboard').toLowerCase()}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
        <p className="text-gray-600">{t('auth.welcome')} {t('admin.dashboard').toLowerCase()}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => (
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