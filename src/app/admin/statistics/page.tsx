'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

interface Stats {
  products: number
  categories: number
  orders: number
  users: number
  revenue: {
    total: number
    subtotal: number
    tax: number
    shipping: number
    discount: number
    average: number
    orderCount: number
  }
  recentOrders: Array<{
    id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
    customer: {
      name: string
      email: string
    }
    items: Array<{
      quantity: number
      product: {
        name: string
      }
    }>
  }>
  topProducts: Array<{
    id: string
    name: string
    price: number
    totalSold: number
    images: Array<{
      url: string
      alt: string
    }>
  }>
  ordersByStatus: Array<{
    status: string
    _count: {
      id: number
    }
  }>
  monthlyRevenue: Record<string, number>
  productStatus: Array<{
    isActive: boolean
    _count: {
      id: number
    }
  }>
  featuredProducts: number
  userRoles: Array<{
    role: string
    _count: {
      id: number
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(stats.revenue.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">{formatCurrency(stats.revenue.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-medium">{formatCurrency(stats.revenue.shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discounts:</span>
              <span className="font-medium text-red-600">-{formatCurrency(stats.revenue.discount)}</span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold">
              <span>Total Revenue:</span>
              <span>{formatCurrency(stats.revenue.total)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Average Order Value:</span>
              <span>{formatCurrency(stats.revenue.average)}</span>
            </div>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {stats.ordersByStatus.map((status) => (
              <div key={status.status} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{status.status}:</span>
                <span className="font-medium">{status._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Status</h3>
          <div className="space-y-3">
            {stats.productStatus.map((status) => (
              <div key={status.isActive} className="flex justify-between items-center">
                <span className="text-gray-600">
                  {status.isActive ? 'Active Products' : 'Inactive Products'}:
                </span>
                <span className="font-medium">{status._count.id}</span>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Featured Products:</span>
              <span className="font-medium">{stats.featuredProducts}</span>
            </div>
          </div>
        </div>

        {/* User Roles */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
          <div className="space-y-3">
            {stats.userRoles.map((role) => (
              <div key={role.role} className="flex justify-between items-center">
                <span className="text-gray-600 capitalize">{role.role}s:</span>
                <span className="font-medium">{role._count.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.topProducts.map((product, index) => (
            <div key={product.id} className="border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].alt || product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">📦</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                  <p className="text-sm text-blue-600 font-medium">
                    {product.totalSold} sold
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{order.customer.name}</div>
                      <div className="text-gray-500">{order.customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.items.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue (Last 6 Months)</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {Object.entries(stats.monthlyRevenue).map(([month, revenue]) => (
            <div key={month} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-blue-200 rounded-t" style={{ height: `${(revenue / Math.max(...Object.values(stats.monthlyRevenue))) * 200}px` }}>
                <div className="bg-blue-600 w-full h-full rounded-t"></div>
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center">
                <div>{formatCurrency(revenue)}</div>
                <div className="font-medium">{month}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 