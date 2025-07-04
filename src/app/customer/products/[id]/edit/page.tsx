'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { use } from 'react'
import { Product, Category, ProductImage } from '@/types'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default function CustomerEditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Image management state
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [reorderingImages, setReorderingImages] = useState(false)

  // Redirect if not authenticated or not customer
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }
    
    if (session.user.role !== 'CUSTOMER') {
      router.push('/')
      return
    }
  }, [session, status, router])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    sku: '',
    price: '',
    comparePrice: '',
    categoryId: '',
    isActive: true,
    isFeatured: false,
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    }
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product data
        const productResponse = await fetch(`/api/products/${id}`)
        if (!productResponse.ok) {
          throw new Error('Product not found')
        }
        const productData = await productResponse.json()
        
        // Check if the product belongs to the current customer
        if (productData.customerId !== session?.user.id) {
          setError('You can only edit your own products')
          setLoading(false)
          return
        }
        
        setProduct(productData)
        setExistingImages(productData.images || [])

        // Fetch categories
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.data || [])
        }

        // Set form data
        setFormData({
          name: productData.name || '',
          description: productData.description || '',
          slug: productData.slug || '',
          sku: productData.sku || '',
          price: productData.price?.toString() || '',
          comparePrice: productData.comparePrice?.toString() || '',
          categoryId: productData.categoryId || '',
          isActive: productData.isActive ?? true,
          isFeatured: productData.isFeatured ?? false,
          weight: productData.weight?.toString() || '',
          dimensions: {
            length: productData.dimensions?.length?.toString() || '',
            width: productData.dimensions?.width?.toString() || '',
            height: productData.dimensions?.height?.toString() || ''
          }
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(t('errors.somethingWentWrong'))
      } finally {
        setLoading(false)
      }
    }

    if (session?.user.role === 'CUSTOMER') {
      fetchData()
    }
  }, [id, t, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Client-side validation
    if (!formData.name.trim()) {
      setError('Product name is required')
      setSaving(false)
      return
    }
    if (!formData.slug.trim()) {
      setError('Slug is required')
      setSaving(false)
      return
    }
    if (!formData.sku.trim()) {
      setError('SKU is required')
      setSaving(false)
      return
    }
    if (!formData.categoryId) {
      setError('Category is required')
      setSaving(false)
      return
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required')
      setSaving(false)
      return
    }

    try {
      // Upload new images first if any
      let uploadedImages: Array<{
        url: string
        alt: string
        isPrimary: boolean
        order: number
      }> = []
      
      if (newImages.length > 0) {
        uploadedImages = await uploadNewImages()
        
        // Add new images to the product
        if (uploadedImages.length > 0) {
          const addImagesResponse = await fetch(`/api/products/${id}/images`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              images: uploadedImages.map((img, index) => ({
                ...img,
                order: existingImages.length + index
              }))
            }),
          })

          if (!addImagesResponse.ok) {
            throw new Error('Failed to add new images to product')
          }
        }
      }

      // Update product data
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
          weight: formData.weight ? parseInt(formData.weight) : null,
          dimensions: {
            length: parseFloat(formData.dimensions.length) || 0,
            width: parseFloat(formData.dimensions.width) || 0,
            height: parseFloat(formData.dimensions.height) || 0,
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          throw new Error('You are not authorized to edit this product.')
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid data provided')
        } else {
          throw new Error(errorData.error || 'Failed to update product')
        }
      }

      const result = await response.json()
      console.log('Product updated successfully:', result)

      router.push('/customer/products')
    } catch (error) {
      console.error('Error updating product:', error)
      setError(error instanceof Error ? error.message : t('errors.somethingWentWrong'))
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleDimensionChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [field]: value
      }
    }))
  }

  const uploadNewImages = async (): Promise<Array<{
    url: string
    alt: string
    isPrimary: boolean
    order: number
  }>> => {
    if (newImages.length === 0) {
      return []
    }

    setUploadingImages(true)
    try {
      const formData = new FormData()
      newImages.forEach((file) => {
        formData.append('images', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload images')
      }

      const result = await response.json()
      return result.images
    } catch (error) {
      console.error('Error uploading images:', error)
      throw error
    } finally {
      setUploadingImages(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNewImages(prev => [...prev, ...files])
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${id}/images/${imageId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete image')
      }

      setExistingImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image. Please try again.')
    }
  }

  const setPrimaryImage = async (imageId: string) => {
    try {
      setReorderingImages(true)
      
      // Update the order of all images to set the selected one as primary
      const updatedImages = existingImages.map((img, index) => ({
        id: img.id,
        order: img.id === imageId ? 0 : index + 1
      }))

      const response = await fetch(`/api/products/${id}/images/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: updatedImages }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder images')
      }

      // Update local state
      setExistingImages(prev => 
        prev.map(img => ({
          ...img,
          isPrimary: img.id === imageId
        }))
      )
    } catch (error) {
      console.error('Error setting primary image:', error)
      alert('Failed to set primary image. Please try again.')
    } finally {
      setReorderingImages(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      setNewImages(prev => [...prev, ...files])
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!session || session.user.role !== 'CUSTOMER') {
    return null
  }

  if (error && !product) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-black">Edit Product</h1>
            <p className="text-black">Update your product information</p>
          </div>
          <Link
            href="/customer/products"
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to Products
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-black">Edit Product</h1>
            <p className="text-black">Update your product information</p>
          </div>
          <Link
            href="/customer/products"
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to Products
          </Link>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-600">Product not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Edit Product</h1>
          <p className="text-black">Update your product information</p>
        </div>
        <Link
          href="/customer/products"
          className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Back to Products
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-black">
              Slug *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-black">
              SKU *
            </label>
            <input
              type="text"
              id="sku"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-black">
              Category *
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-black">
              Price *
            </label>
            <input
              type="number"
              step="0.01"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="comparePrice" className="block text-sm font-medium text-black">
              Compare Price
            </label>
            <input
              type="number"
              step="0.01"
              id="comparePrice"
              name="comparePrice"
              value={formData.comparePrice}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-black">
              Weight (grams)
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-black">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Existing Images Section */}
        {existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Current Images ({existingImages.length})
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {existingImages.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.url}
                    alt={image.alt || 'Product image'}
                    className="w-full h-24 object-cover rounded-lg border border-gray-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(image.id)}
                        disabled={reorderingImages}
                        className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs hover:bg-blue-600 disabled:opacity-50"
                        title="Set as primary"
                      >
                        {image.isPrimary ? '★' : '☆'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs hover:bg-red-600"
                        title="Delete image"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {image.isPrimary && (
                    <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs px-1 rounded">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Add New Images
          </label>
          
          {/* Image Upload Input */}
          <div 
            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="new-images"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload images</span>
                  <input
                    id="new-images"
                    name="new-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>

          {/* New Images Preview */}
          {newImages.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-black mb-2">New Images to Upload ({newImages.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {newImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="mt-1 text-xs text-gray-500 truncate">{file.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadingImages && (
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Uploading images...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="length" className="block text-sm font-medium text-black">
              Length (cm)
            </label>
            <input
              type="number"
              step="0.1"
              id="length"
              value={formData.dimensions.length}
              onChange={(e) => handleDimensionChange('length', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="width" className="block text-sm font-medium text-black">
              Width (cm)
            </label>
            <input
              type="number"
              step="0.1"
              id="width"
              value={formData.dimensions.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="height" className="block text-sm font-medium text-black">
              Height (cm)
            </label>
            <input
              type="number"
              step="0.1"
              id="height"
              value={formData.dimensions.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-black">
              Active
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-black">
              Featured
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/customer/products"
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  )
} 