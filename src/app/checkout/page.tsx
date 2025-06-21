'use client'

import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function CheckoutPage() {
  const { state, clearCart } = useCart()
  const { t } = useLanguage()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?redirect=/checkout')
    return null
  }

  // Show loading while checking authentication
  if (status === 'loading') {
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

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('checkout.cartEmpty') || 'Your cart is empty'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('checkout.cartEmptyDescription') || 'Add some items to your cart before checkout'}
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

  const handleCheckout = async () => {
    if (state.items.length === 0) {
      alert(t('checkout.cartEmpty') || 'Your cart is empty')
      return
    }

    setIsProcessing(true)

    try {
      // Create order using authenticated user's information
      const orderData = {
        items: state.items,
        total: state.total,
        billingInfo: {
          firstName: session?.user?.name?.split(' ')[0] || '',
          lastName: session?.user?.name?.split(' ').slice(1).join(' ') || '',
          email: session?.user?.email || '',
          phone: '', // Will be filled from user profile or can be added later
          address: '', // Will be filled from user profile or can be added later
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
        orderDate: new Date().toISOString()
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      const order = await response.json()
      
      // Clear cart after successful order
      clearCart()
      
      // Redirect to order confirmation page
      router.push(`/checkout/success?orderId=${order.id}`)
    } catch (error) {
      console.error('Checkout error:', error)
      alert(t('checkout.error') || 'An error occurred during checkout. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('checkout.title') || 'Checkout'}</h1>
            <p className="text-gray-600">{t('checkout.subtitle') || 'Complete your purchase'}</p>
          </div>

          {/* Customer Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {t('checkout.customerInfo') || 'Customer Information'}
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {session?.user?.name || 'Customer'}
                  </h3>
                  <p className="text-gray-600">{session?.user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {t('checkout.orderSummary') || 'Order Summary'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {state.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
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
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">
                    {t('checkout.subtotal') || 'Subtotal'}
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">
                    ${state.total.toFixed(2)}
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
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <dt className="text-base font-medium text-gray-900">
                    {t('checkout.total') || 'Total'}
                  </dt>
                  <dd className="text-base font-medium text-gray-900">
                    ${state.total.toFixed(2)}
                  </dd>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isProcessing || state.items.length === 0}
                  className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('checkout.processing') || 'Processing...'}
                    </>
                  ) : (
                    t('checkout.placeOrder') || 'Place Order'
                  )}
                </button>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>
                  {t('checkout.secureCheckout') || 'Secure checkout powered by our payment system'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 