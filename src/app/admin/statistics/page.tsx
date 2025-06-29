'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

interface Stats {
  products: number
  categories: number
  orders: number
  users: number
  revenue: {
    total: number
    orderCount: number
  }
  categorySales: Array<{
    name: string
    totalSold: number
    productCount: number
  }>
}

export default function StatisticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }
    
    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch statistics')
        }
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching stats:', error)
        setError(t('errors.somethingWentWrong'))
      } finally {
        setLoading(false)
      }
    }

    if (session?.user.role === 'ADMIN') {
      fetchStats()
    }
  }, [session, t])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No statistics available</p>
        </div>
      </div>
    )
  }

  // Calculate max sold for chart scaling
  const maxSold = Math.max(...stats.categorySales.map(cat => cat.totalSold), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics Dashboard</h1>
          <p className="text-gray-600">Overview of your store's performance</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.products}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue.total)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Sales Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Products Sold by Category</h3>
        
        {stats.categorySales.length > 0 ? (
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Pie Chart */}
            <div className="flex-shrink-0">
              <div className="relative w-64 h-64">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {(() => {
                    const total = stats.categorySales.reduce((sum, cat) => sum + cat.totalSold, 0)
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']
                    let currentAngle = 0
                    
                    return stats.categorySales.map((category, index) => {
                      const percentage = (category.totalSold / total) * 100
                      const angle = (percentage / 100) * 360
                      const startAngle = currentAngle
                      const endAngle = currentAngle + angle
                      
                      const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
                      const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
                      const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
                      const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)
                      
                      const largeArcFlag = angle > 180 ? 1 : 0
                      
                      const pathData = [
                        `M 50 50`,
                        `L ${x1} ${y1}`,
                        `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z'
                      ].join(' ')
                      
                      currentAngle += angle
                      
                      return (
                        <path
                          key={category.name}
                          d={pathData}
                          fill={colors[index % colors.length]}
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      )
                    })
                  })()}
                  {/* Center circle for donut effect */}
                  <circle cx="50" cy="50" r="15" fill="white" />
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.categorySales.reduce((sum, cat) => sum + cat.totalSold, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Total Sold</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex-1 min-w-0">
              <div className="space-y-3">
                {stats.categorySales.map((category, index) => {
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']
                  const percentage = ((category.totalSold / stats.categorySales.reduce((sum, cat) => sum + cat.totalSold, 0)) * 100).toFixed(1)
                  
                  return (
                    <div key={category.name} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                          <p className="text-sm font-bold text-gray-900">{category.totalSold}</p>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-500">{category.productCount} products</p>
                          <p className="text-xs text-gray-500">{percentage}%</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl text-gray-300 mb-4">📊</div>
            <p className="text-gray-500">No sales data available</p>
            <p className="text-sm text-gray-400">Sales will appear here once orders are placed</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-black mb-4">Sales Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Categories with Sales:</span>
              <span className="font-medium">{stats.categorySales.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Products Sold:</span>
              <span className="font-medium">
                {stats.categorySales.reduce((sum, cat) => sum + cat.totalSold, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Order Value:</span>
              <span className="font-medium">
                {stats.revenue.orderCount > 0 
                  ? formatCurrency(stats.revenue.total / stats.revenue.orderCount)
                  : formatCurrency(0)
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Categories</h3>
          <div className="space-y-3">
            {stats.categorySales.slice(0, 3).map((category, index) => (
              <div key={category.name} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <span className="text-gray-900 font-medium">{category.name}</span>
                </div>
                <span className="text-blue-600 font-bold">{category.totalSold} sold</span>
              </div>
            ))}
            {stats.categorySales.length === 0 && (
              <p className="text-gray-500 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 