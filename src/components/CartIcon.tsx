'use client'

import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function CartIcon() {
  const { state } = useCart()
  const { t } = useLanguage()

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center p-2 text-gray-600 hover:text-gray-900 transition-colors"
      title={t('cart.title') || 'Cart'}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
        />
      </svg>
      
      {state.itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {state.itemCount > 99 ? '99+' : state.itemCount}
        </span>
      )}
    </Link>
  )
} 