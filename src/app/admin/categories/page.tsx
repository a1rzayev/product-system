'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import CategoryTable from '@/components/admin/CategoryTable'
import { useState, useEffect, useCallback } from 'react'

interface Category {
  id: string
  name: string
  description?: string
  slug: string
  createdAt: string
  updatedAt: string
}

export default function AdminCategories() {
  const { t } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
      try {
        const response = await fetch('/api/categories')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const result = await response.json()
        setCategories(result || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleCategoryDeleted = useCallback(() => {
    // Refresh the categories list after deletion
    fetchCategories()
  }, [fetchCategories])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('categories.title')}</h1>
            <p className="text-gray-600">{t('categories.title')}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">{t('categories.title')}</h1>
          <p className="text-gray-600">{t('categories.title')}</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('categories.addCategory')}
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('categories.title')}</h2>
          <p className="text-sm text-gray-600">
            {categories.length} {t('categories.title').toLowerCase()} {t('common.loading')}
          </p>
        </div>
        <CategoryTable categories={categories} onCategoryDeleted={handleCategoryDeleted} />
      </div>
    </div>
  )
} 