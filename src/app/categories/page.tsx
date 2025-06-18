'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { categoryService } from '@/lib/db'
import Link from 'next/link'

export default function CategoriesPage() {
  const { t } = useLanguage()
  const categories = await categoryService.getAll()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('categories.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('categories.noCategories')}
          </p>
        </div>
      </div>
    </div>
  )
} 