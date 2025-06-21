'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Order {
  id: string
  orderNumber: string
  items: Array<{
    id: string
    productId: string
    name: string
    price: number
    quantity: number
    image?: string
    sku: string
  }>
  total: number
  billingInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  orderDate: string
  status: string
}

export default function CheckoutSuccessPage() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadBill = async () => {
    if (!order) return

    setDownloading(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${order.orderNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error('Failed to generate bill')
      }
    } catch (error) {
      console.error('Error downloading bill:', error)
      alert(t('checkout.billDownloadError') || 'Failed to download bill. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-red-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('checkout.orderNotFound') || 'Order not found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('checkout.orderNotFoundDescription') || 'The order you are looking for does not exist.'}
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('checkout.continueShopping') || 'Continue Shopping'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Success Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-green-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {t('checkout.orderConfirmed') || 'Order Confirmed!'}
            </h1>
            <p className="mt-1 text-gray-600">
              {t('checkout.orderConfirmedDescription') || 'Thank you for your purchase. Your order has been successfully placed.'}
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
            {/* Order Details */}
            <div className="lg:col-span-7">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    {t('checkout.orderDetails') || 'Order Details'}
                  </h2>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.orderNumber') || 'Order Number'}
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {order.orderNumber}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('checkout.orderDate') || 'Order Date'}
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('checkout.orderStatus') || 'Order Status'}
                    </label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('checkout.statusConfirmed') || 'Confirmed'}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      {t('checkout.orderItems') || 'Order Items'}
                    </h3>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                          <div className="flex-shrink-0 w-12 h-12">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} | SKU: {item.sku}
                            </p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Billing Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      {t('checkout.billingInfo') || 'Billing Information'}
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md space-y-2">
                      <p className="text-sm text-gray-900">
                        {order.billingInfo.firstName} {order.billingInfo.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{order.billingInfo.email}</p>
                      <p className="text-sm text-gray-600">{order.billingInfo.phone}</p>
                      <p className="text-sm text-gray-600">
                        {order.billingInfo.address}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.billingInfo.city}, {order.billingInfo.state} {order.billingInfo.zipCode}
                      </p>
                      <p className="text-sm text-gray-600">{order.billingInfo.country}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-8 lg:mt-0 lg:col-span-5">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    {t('checkout.orderSummary') || 'Order Summary'}
                  </h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">
                      {t('checkout.subtotal') || 'Subtotal'}
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      ${order.total.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">
                      {t('checkout.shipping') || 'Shipping'}
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {t('checkout.free') || 'Free'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <dt className="text-base font-medium text-gray-900">
                      {t('checkout.total') || 'Total'}
                    </dt>
                    <dd className="text-base font-medium text-gray-900">
                      ${order.total.toFixed(2)}
                    </dd>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button
                      type="button"
                      onClick={downloadBill}
                      disabled={downloading}
                      className="w-full bg-green-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {downloading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('checkout.downloading') || 'Downloading...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {t('checkout.downloadBill') || 'Download Bill'}
                        </>
                      )}
                    </button>

                    <Link
                      href="/products"
                      className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                    >
                      {t('checkout.continueShopping') || 'Continue Shopping'}
                    </Link>
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    <p>
                      {t('checkout.orderConfirmationNote') || 'A confirmation email has been sent to your email address.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 