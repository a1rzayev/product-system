'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import ProductTable from '@/components/admin/ProductTable'
import { useState, useEffect, useCallback } from 'react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  slug: string
  category?: { name: string }
  createdAt: string
  updatedAt: string
}

export default function AdminProducts() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products?page=1&limit=50')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const result = await response.json()
      setProducts(result.data || [])
      setTotalProducts(result.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleProductDeleted = useCallback(() => {
    // Refresh the products list after deletion
    fetchProducts()
  }, [fetchProducts])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('products.title')}</h1>
            <p className="text-gray-600">{t('products.title')}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">{t('products.title')}</h1>
          <p className="text-gray-600">{t('products.title')}</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('products.addProduct')}
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('products.title')}</h2>
          <p className="text-sm text-gray-600">
            {totalProducts} {t('products.title').toLowerCase()} {t('common.loading')}
          </p>
        </div>
        <ProductTable products={products} onProductDeleted={handleProductDeleted} />
      </div>
    </div>
  )
} 