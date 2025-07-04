'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import ProductTable from '@/components/admin/ProductTable'
import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { Product } from '@/types'

export default function AdminProducts() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
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

  const exportToExcel = async () => {
    setExporting(true)
    try {
      // First, check if we have a large dataset
      const response = await fetch('/api/products?page=1&limit=1')
      if (!response.ok) {
        throw new Error('Failed to check product count')
      }
      const result = await response.json()
      const totalProducts = result.pagination?.total || 0

      let allProducts: any[] = []

      if (totalProducts > 1000) {
        // For large datasets, use the optimized endpoint
        const exportResponse = await fetch('/api/products?action=export-large', {
          method: 'POST'
        })
        
        if (!exportResponse.ok) {
          const errorData = await exportResponse.json()
          if (exportResponse.status === 413) {
            alert(`Export failed: ${errorData.message}`)
            return
          }
          throw new Error('Failed to export large dataset')
        }
        
        const exportResult = await exportResponse.json()
        allProducts = exportResult.data
      } else {
        // For smaller datasets, use the regular endpoint
        const response = await fetch('/api/products?page=1&limit=5000')
        if (!response.ok) {
          throw new Error('Failed to fetch products for export')
        }
        const result = await response.json()
        allProducts = result.data || []
      }

      // Prepare data for Excel
      const excelData = allProducts.map((product: Product) => ({
        'ID': product.id,
        'Name': product.name,
        'Description': product.description,
        'Price': product.price,
        'SKU': product.sku,
        'Category': product.category?.name || 'No Category',
        'Customer': product.customer ? `${product.customer.name || 'Unnamed'} (${product.customer.email})` : 'Admin',
        'Status': product.isActive ? 'Active' : 'Inactive',
        'Featured': product.isFeatured ? 'Yes' : 'No',
        'Slug': product.slug,
        'Created At': new Date(product.createdAt).toLocaleDateString(),
        'Updated At': new Date(product.updatedAt).toLocaleDateString()
      }))

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const columnWidths = [
        { wch: 36 }, // ID
        { wch: 30 }, // Name
        { wch: 50 }, // Description
        { wch: 15 }, // Price
        { wch: 20 }, // SKU
        { wch: 20 }, // Category
        { wch: 35 }, // Customer
        { wch: 15 }, // Status
        { wch: 15 }, // Featured
        { wch: 30 }, // Slug
        { wch: 15 }, // Created At
        { wch: 15 }  // Updated At
      ]
      worksheet['!cols'] = columnWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0]
      const filename = `products_export_${date}.xlsx`

      // Save the file
      XLSX.writeFile(workbook, filename)

      // Show success message
      alert(`Successfully exported ${allProducts.length} products to Excel!`)

    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Failed to export products to Excel')
    } finally {
      setExporting(false)
    }
  }

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
        <div className="flex space-x-3">
          <button
            onClick={exportToExcel}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('products.exporting') || 'Exporting...'}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{t('products.exportToExcel') || 'Export to Excel'}</span>
              </>
            )}
          </button>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('products.addProduct')}
          </Link>
        </div>
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