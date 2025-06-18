'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { addLanguageToPathname } from '@/lib/i18n'
import Link from 'next/link'

export default function AdminProductsPage() {
  const { t, language } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('products.title')}</h1>
          <p className="text-gray-600">{t('products.noProducts')}</p>
        </div>
        <Link
          href={addLanguageToPathname('/admin/products/new', language)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {t('products.addProduct')}
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('products.title')}</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-8">
            <p>{t('products.noProducts')}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 