'use client'

import Link from 'next/link'
import { Product } from '@/types'
import { useState } from 'react'
import NotesPopup from './NotesPopup'

interface ProductTableProps {
  products: Product[]
  onProductDeleted?: () => void
}

export default function ProductTable({ products, onProductDeleted }: ProductTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notesPopup, setNotesPopup] = useState<{
    isOpen: boolean
    productId: string
    productName: string
    currentNotes: string
  }>({
    isOpen: false,
    productId: '',
    productName: '',
    currentNotes: ''
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    )
  }

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(productId)
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      // Call the callback to refresh the data
      if (onProductDeleted) {
        onProductDeleted()
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const openNotesPopup = (product: Product) => {
    setNotesPopup({
      isOpen: true,
      productId: product.id,
      productName: product.name,
      currentNotes: product.notes || ''
    })
  }

  const closeNotesPopup = () => {
    setNotesPopup({
      isOpen: false,
      productId: '',
      productName: '',
      currentNotes: ''
    })
  }

  const handleSaveNotes = async (notes: string) => {
    try {
      const response = await fetch(`/api/products/${notesPopup.productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      // Call the callback to refresh the data
      if (onProductDeleted) {
        onProductDeleted()
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      throw new Error('Failed to save notes. Please try again.')
    }
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
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
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
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {product.images && product.images.length > 0 ? (
                        <img
                          className="h-10 w-10 rounded-lg object-cover"
                          src={product.images[0].url}
                          alt={product.images[0].alt || product.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">📦</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.slug}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.category?.name || 'No Category'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(product.price)}
                  {product.comparePrice && (
                    <span className="ml-2 text-sm text-gray-500 line-through">
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(product.isActive)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="max-w-xs">
                    {product.notes ? (
                      <div className="group relative">
                        <p className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                          {truncateNotes(product.notes)}
                        </p>
                        <button
                          onClick={() => openNotesPopup(product)}
                          className="ml-2 text-blue-600 hover:text-blue-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openNotesPopup(product)}
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
                      href={`/admin/products/${product.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={deletingId === product.id}
                      className={`text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                        deletingId === product.id ? 'cursor-not-allowed' : ''
                      }`}
                    >
                      {deletingId === product.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
            <Link
              href="/admin/products/new"
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              Add your first product
            </Link>
          </div>
        )}
      </div>

      {/* Notes Popup */}
      <NotesPopup
        isOpen={notesPopup.isOpen}
        onClose={closeNotesPopup}
        productId={notesPopup.productId}
        productName={notesPopup.productName}
        currentNotes={notesPopup.currentNotes}
        onSave={handleSaveNotes}
      />
    </>
  )
} 