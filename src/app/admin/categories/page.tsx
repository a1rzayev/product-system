'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import CategoryTable from '@/components/admin/CategoryTable'
import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { Category } from '@/types'

export default function AdminCategories() {
  const { t } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchCategories = useCallback(async () => {
      try {
        const response = await fetch('/api/categories')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const result = await response.json()
        // Extract the data array from the API response
        setCategories(result.data || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([]) // Set empty array on error
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

  const exportToExcel = async () => {
    setExporting(true)
    try {
      // First, check if we have a large dataset
      const response = await fetch('/api/categories?page=1&limit=1')
      if (!response.ok) {
        throw new Error('Failed to check category count')
      }
      const result = await response.json()
      const totalCategories = result.pagination?.total || 0

      let allCategories: any[] = []

      if (totalCategories > 1000) {
        // For large datasets, use the optimized endpoint
        const exportResponse = await fetch('/api/categories?action=export-large', {
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
        allCategories = exportResult.data
      } else {
        // For smaller datasets, use the regular endpoint
        const response = await fetch('/api/categories?page=1&limit=5000')
        if (!response.ok) {
          throw new Error('Failed to fetch categories for export')
        }
        const result = await response.json()
        allCategories = result.data || []
      }

      // Prepare data for Excel
      const excelData = allCategories.map((category: any) => ({
        'ID': category.id,
        'Name': category.name,
        'Description': category.description || 'No Description',
        'Slug': category.slug,
        'Parent Category': category.parent?.name || 'No Parent',
        'Products Count': category._count?.products || 0,
        'Subcategories Count': category._count?.children || 0,
        'Created At': new Date(category.createdAt).toLocaleDateString(),
        'Updated At': new Date(category.updatedAt).toLocaleDateString()
      }))

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const columnWidths = [
        { wch: 36 }, // ID
        { wch: 30 }, // Name
        { wch: 50 }, // Description
        { wch: 30 }, // Slug
        { wch: 25 }, // Parent Category
        { wch: 20 }, // Products Count
        { wch: 25 }, // Subcategories Count
        { wch: 15 }, // Created At
        { wch: 15 }  // Updated At
      ]
      worksheet['!cols'] = columnWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories')

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0]
      const filename = `categories_export_${date}.xlsx`

      // Save the file
      XLSX.writeFile(workbook, filename)

      // Show success message
      alert(`Successfully exported ${allCategories.length} categories to Excel!`)

    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Failed to export categories to Excel')
    } finally {
      setExporting(false)
    }
  }

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
        <div className="flex space-x-3">
          <button
            onClick={exportToExcel}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('categories.exporting') || 'Exporting...'}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{t('categories.exportToExcel') || 'Export to Excel'}</span>
              </>
            )}
          </button>
          <Link
            href="/admin/categories/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('categories.addCategory')}
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t('categories.title')}</h2>
          <p className="text-sm text-gray-600">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} found
          </p>
        </div>
        <CategoryTable categories={categories} onCategoryDeleted={handleCategoryDeleted} />
      </div>
    </div>
  )
} 