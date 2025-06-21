'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import SearchBar from '@/components/SearchBar'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Category {
  id: string
  name: string
  description?: string
  slug: string
  parent?: { id: string; name: string; slug: string }
  children?: Array<{ id: string; name: string; slug: string }>
  _count?: { products: number; children: number }
}

export default function CategoriesPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0
  })

  // Get current page from URL
  const currentPage = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams(searchParams.toString())
        const response = await fetch(`/api/categories?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const result = await response.json()
        setCategories(result.data || [])
        setPagination(result.pagination || { page: 1, total: 0, totalPages: 0 })
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [searchParams])

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/categories?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('categories.title')}</h1>
          <p className="text-gray-600">
            {pagination.total} {pagination.total === 1 ? 'category' : 'categories'} found
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <SearchBar
            placeholder={t('categories.searchPlaceholder') || 'Search categories...'}
            showFilters={true}
            showSorting={true}
            pathname="/categories"
          />
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('categories.noCategoriesFound') || 'No categories found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('categories.tryDifferentSearch') || 'Try adjusting your search or filters'}
            </p>
            <button
              onClick={() => router.push('/categories')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {t('common.clearFilters') || 'Clear all filters'}
            </button>
          </div>
        ) : (
          <>
            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/products?category=${category.id}`} className="block">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        <div className="text-2xl">📁</div>
                      </div>
                      
                      {category.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      
                      <div className="space-y-2">
                        {category._count?.products && (
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-2">📦</span>
                            {category._count.products} {t('categories.products') || 'products'}
                          </div>
                        )}
                        
                        {category._count?.children && (
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-2">📂</span>
                            {category._count.children} {t('categories.subcategories') || 'subcategories'}
                          </div>
                        )}
                        
                        {category.parent && (
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-2">⬆️</span>
                            {t('categories.parent') || 'Parent'}: {category.parent.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  
                  {/* View Products Button */}
                  <div className="px-6 pb-6">
                    <Link
                      href={`/products?category=${category.id}`}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                    >
                      {t('categories.viewProducts') || 'View Products'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.previous') || 'Previous'}
                  </button>
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('common.next') || 'Next'}
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 