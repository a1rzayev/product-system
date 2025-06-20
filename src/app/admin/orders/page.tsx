'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { Order } from '@/types'

export default function AdminOrdersPage() {
  const { t } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [totalOrders, setTotalOrders] = useState(0)

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders?page=1&limit=50')
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      const result = await response.json()
      setOrders(result.data || [])
      setTotalOrders(result.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const exportToExcel = async () => {
    setExporting(true)
    try {
      // First, check if we have a large dataset
      const response = await fetch('/api/orders?page=1&limit=1')
      if (!response.ok) {
        throw new Error('Failed to check order count')
      }
      const result = await response.json()
      const totalOrders = result.pagination?.total || 0

      let allOrders: any[] = []

      if (totalOrders > 1000) {
        // For large datasets, use the optimized endpoint
        const exportResponse = await fetch('/api/orders?action=export-large', {
          method: 'POST'
        })
        
        if (!exportResponse.ok) {
          const errorData = await exportResponse.json()
          if (exportResponse.status === 413) {
            alert(`Export failed: ${errorData.message}`)
            return
          }
          throw new Error('Failed to export large dataset')
        }
        
        const exportResult = await exportResponse.json()
        allOrders = exportResult.data
      } else {
        // For smaller datasets, use the regular endpoint
        const response = await fetch('/api/orders?page=1&limit=5000')
        if (!response.ok) {
          throw new Error('Failed to fetch orders for export')
        }
        const result = await response.json()
        allOrders = result.data || []
      }

      // Prepare data for Excel
      const excelData = allOrders.map((order: any) => ({
        'Order ID': order.id,
        'Order Number': order.orderNumber,
        'Customer Name': order.customer?.name || 'No Name',
        'Customer Email': order.customer?.email || 'No Email',
        'Status': order.status,
        'Total': order.total,
        'Subtotal': order.subtotal,
        'Tax': order.tax,
        'Shipping': order.shipping,
        'Discount': order.discount,
        'Items Count': order.items?.length || 0,
        'Shipping City': order.shippingAddress?.city || 'N/A',
        'Shipping Country': order.shippingAddress?.country || 'N/A',
        'Notes': order.notes || 'No Notes',
        'Created At': new Date(order.createdAt).toLocaleDateString(),
        'Updated At': new Date(order.updatedAt).toLocaleDateString()
      }))

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const columnWidths = [
        { wch: 36 }, // Order ID
        { wch: 20 }, // Order Number
        { wch: 25 }, // Customer Name
        { wch: 30 }, // Customer Email
        { wch: 15 }, // Status
        { wch: 15 }, // Total
        { wch: 15 }, // Subtotal
        { wch: 12 }, // Tax
        { wch: 12 }, // Shipping
        { wch: 12 }, // Discount
        { wch: 15 }, // Items Count
        { wch: 20 }, // Shipping City
        { wch: 20 }, // Shipping Country
        { wch: 30 }, // Notes
        { wch: 15 }, // Created At
        { wch: 15 }  // Updated At
      ]
      worksheet['!cols'] = columnWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0]
      const filename = `orders_export_${date}.xlsx`

      // Save the file
      XLSX.writeFile(workbook, filename)

      // Show success message
      alert(`Successfully exported ${allOrders.length} orders to Excel!`)

    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Failed to export orders to Excel')
    } finally {
      setExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'CONFIRMED': { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      'PROCESSING': { color: 'bg-purple-100 text-purple-800', label: 'Processing' },
      'SHIPPED': { color: 'bg-indigo-100 text-indigo-800', label: 'Shipped' },
      'DELIVERED': { color: 'bg-green-100 text-green-800', label: 'Delivered' },
      'CANCELLED': { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      'REFUNDED': { color: 'bg-gray-100 text-gray-800', label: 'Refunded' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
            <p className="text-gray-600">{t('orders.subtitle') || 'Manage customer orders'}</p>
          </div>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
          <p className="text-gray-600">{t('orders.subtitle') || 'Manage customer orders'}</p>
        </div>
        <button
          onClick={exportToExcel}
          disabled={exporting}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{t('orders.exporting') || 'Exporting...'}</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{t('orders.exportToExcel') || 'Export to Excel'}</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('orders.title')}</h2>
          <p className="text-sm text-gray-600">
            {totalOrders} {t('orders.title').toLowerCase()} {t('common.total')}
          </p>
        </div>
        
        {orders.length > 0 ? (
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {order.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer?.name || 'No Name'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer?.email || 'No Email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('orders.noOrders')}</h3>
            <p className="text-gray-500">
              {t('orders.noOrdersDescription') || 'No orders have been placed yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 