'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { productService } from '@/lib/db'
import Link from 'next/link'

export default function ProductsPage() {
  const { t } = useLanguage()
  const products = await productService.getAll(1, 20)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('products.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('products.noProducts')}
          </p>
        </div>
      </div>
    </div>
  )
} 