'use client'

import Link from 'next/link'
import { Category } from '@/types'
import { useState } from 'react'
import CategoryNotesPopup from './CategoryNotesPopup'

interface CategoryTableProps {
  categories: Category[]
  onCategoryDeleted?: () => void
}

export default function CategoryTable({ categories, onCategoryDeleted }: CategoryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notesPopup, setNotesPopup] = useState<{
    isOpen: boolean
    categoryId: string
    categoryName: string
    currentNotes?: string
  }>({
    isOpen: false,
    categoryId: '',
    categoryName: '',
    currentNotes: ''
  })

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(categoryId)
    
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete category')
      }

      // Call the callback to refresh the data
      if (onCategoryDeleted) {
        onCategoryDeleted()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaveNotes = async (notes: string) => {
    try {
      const response = await fetch(`/api/categories/${notesPopup.categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      // Refresh the data
      if (onCategoryDeleted) {
        onCategoryDeleted()
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      throw error
    }
  }

  const openNotesPopup = (category: Category) => {
    setNotesPopup({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name,
      currentNotes: category.notes
    })
  }

  const closeNotesPopup = () => {
    setNotesPopup({
      isOpen: false,
      categoryId: '',
      categoryName: '',
      currentNotes: ''
    })
  }

  const truncateNotes = (notes: string, maxLength: number = 50) => {
    if (!notes) return ''
    return notes.length > maxLength ? notes.substring(0, maxLength) + '...' : notes
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories && categories.length > 0 ? categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {category.images && category.images.length > 0 ? (
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={category.images[0].url}
                          alt={category.images[0].alt || category.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">📁</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                      {category.description && (
                        <div className="text-sm text-gray-500">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {category.slug}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {category.parent?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {category._count?.products || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="max-w-xs">
                    {category.notes ? (
                      <div className="group relative">
                        <p className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                          {truncateNotes(category.notes)}
                        </p>
                        <button
                          onClick={() => openNotesPopup(category)}
                          className="ml-2 text-blue-600 hover:text-blue-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openNotesPopup(category)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Add notes
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Link
                      href={`/admin/categories/${category.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      disabled={deletingId === category.id}
                      className={`text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                        deletingId === category.id ? 'cursor-not-allowed' : ''
                      }`}
                    >
                      {deletingId === category.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            )) : null}
          </tbody>
        </table>
        
        {(!categories || categories.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories found</p>
            <Link
              href="/admin/categories/new"
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              Add your first category
            </Link>
          </div>
        )}
      </div>

      <CategoryNotesPopup
        isOpen={notesPopup.isOpen}
        onClose={closeNotesPopup}
        categoryId={notesPopup.categoryId}
        categoryName={notesPopup.categoryName}
        currentNotes={notesPopup.currentNotes}
        onSave={handleSaveNotes}
      />
    </>
  )
} 