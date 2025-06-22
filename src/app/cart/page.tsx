'use client'

import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function CartPage() {
  const { state, removeItem, updateQuantity, clearCart } = useCart()
  const { t } = useLanguage()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    setIsUpdating(id)
    updateQuantity(id, newQuantity)
    // Small delay to show loading state
    setTimeout(() => setIsUpdating(null), 300)
  }

  const handleRemoveItem = (id: string) => {
    removeItem(id)
  }

  const handleClearCart = () => {
    if (confirm(t('cart.clearConfirm') || 'Are you sure you want to clear your cart?')) {
      clearCart()
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('cart.empty') || 'Your cart is empty'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('cart.emptyDescription') || 'Start shopping to add items to your cart'}
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('cart.continueShopping') || 'Continue Shopping'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('cart.title') || 'Shopping Cart'}</h1>
            <p className="text-gray-600">{t('cart.subtitle') || 'Review your items and proceed to checkout'}</p>
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
            <div className="lg:col-span-7">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">{t('cart.items') || 'Cart Items'}</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {state.items.map((item) => (
                    <div key={item.id} className="p-6 flex">
                      <div className="flex-shrink-0 w-24 h-24">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>
                              <Link href={`/products/${item.productId}`} className="hover:text-blue-600">
                                {item.name}
                              </Link>
                            </h3>
                            <p className="ml-4">${item.price.toFixed(2)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">SKU: {item.sku}</p>
                        </div>
                        <div className="flex-1 flex items-end justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <label htmlFor={`quantity-${item.id}`} className="text-gray-700">
                              {t('cart.quantity') || 'Qty'}:
                            </label>
                            <select
                              id={`quantity-${item.id}`}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                              disabled={isUpdating === item.id}
                              className="max-w-full rounded-md border border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </select>
                            {isUpdating === item.id && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            )}
                          </div>

                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="font-medium text-blue-600 hover:text-blue-500"
                            >
                              {t('cart.remove') || 'Remove'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-sm text-gray-600 hover:text-gray-500"
                  >
                    {t('cart.clearCart') || 'Clear Cart'}
                  </button>
                  <Link
                    href="/products"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    {t('cart.continueShopping') || 'Continue Shopping'}
                  </Link>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="mt-8 lg:mt-0 lg:col-span-5">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    {t('cart.orderSummary') || 'Order Summary'}
                  </h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">
                      {t('cart.subtotal') || 'Subtotal'}
                    </dt>
                    <dd className="text-sm font-medium text-gray-900">
                      ${state.total.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <dt className="text-base font-medium text-gray-900">
                      {t('cart.total') || 'Total'}
                    </dt>
                    <dd className="text-base font-medium text-gray-900">
                      ${state.total.toFixed(2)}
                    </dd>
                  </div>

                  <div className="pt-4">
                    <Link
                      href="/checkout"
                      className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {t('cart.checkout') || 'Proceed to Checkout'}
                    </Link>
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    <p>
                      {t('cart.secureCheckout') || 'Secure checkout powered by our payment system'}
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