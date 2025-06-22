'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { use } from 'react'
import { Category, CategoryImage } from '@/types'

interface EditCategoryPageProps {
  params: Promise<{ id: string }>
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { t } = useLanguage()
  const [category, setCategory] = useState<Category | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<CategoryImage[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parentId: ''
  })

  // Upload images function
  const uploadImages = async (): Promise<any[]> => {
    if (images.length === 0) return []

    const uploadedImages = []

    for (let i = 0; i < images.length; i++) {
      const file = images[i]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'categories')

      try {
        console.log(`Uploading file ${i + 1}/${images.length}:`, file.name, file.size, file.type)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        console.log('Upload response status:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Upload response error:', errorText)
          throw new Error(`Failed to upload ${file.name}: ${response.status} ${errorText}`)
        }

        const result = await response.json()
        console.log('Upload result:', result)
        
        uploadedImages.push({
          url: result.url,
          alt: file.name,
          isPrimary: existingImages.length === 0 && i === 0, // Primary if no existing images and first new image
          order: existingImages.length + i
        })
      } catch (error) {
        console.error('Error uploading image:', error)
        throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return uploadedImages
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch category data
        const categoryResponse = await fetch(`/api/categories/${id}`)
        if (!categoryResponse.ok) {
          throw new Error('Category not found')
        }
        const categoryData = await categoryResponse.json()
        setCategory(categoryData)
        setExistingImages(categoryData.images || [])

        // Fetch all categories for parent selection
        const categoriesResponse = await fetch('/api/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          // Filter out the current category from parent options
          const filteredCategories = (categoriesData.data || []).filter((cat: Category) => cat.id !== id)
          setCategories(filteredCategories)
        }

        // Set form data
        setFormData({
          name: categoryData.name || '',
          description: categoryData.description || '',
          slug: categoryData.slug || '',
          parentId: categoryData.parentId || ''
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(t('errors.somethingWentWrong'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      console.log('Starting form submission...')
      console.log('Images to upload:', images.length)
      
      // Upload new images first
      const uploadedImages = await uploadImages()
      console.log('Uploaded images:', uploadedImages)

      // Combine existing and new images
      const allImages = [
        ...existingImages.map((img, index) => ({
          url: img.url,
          alt: img.alt || '',
          isPrimary: img.isPrimary,
          order: index
        })),
        ...uploadedImages
      ]

      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
          images: allImages
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error('Failed to update category')
      }

      const result = await response.json()
      console.log('Category updated successfully:', result)

      router.push('/admin/categories')
    } catch (error) {
      console.error('Error updating category:', error)
      setError(t('errors.somethingWentWrong'))
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImages(prev => [...prev, ...files])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const setPrimaryImage = (index: number) => {
    setExistingImages(prev => 
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error && !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/admin/categories" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            {t('common.back')} {t('categories.title')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">{t('categories.editCategory')}</h1>
          <p className="text-black">{t('categories.updateCategoryInfo')}</p>
        </div>
        <Link
          href="/admin/categories"
          className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('common.back')} {t('categories.title')}
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
              {t('categories.categoryName')} *
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

          <div className="md:col-span-2">
            <label htmlFor="parentId" className="block text-sm font-medium text-black">
              {t('categories.parentCategory')}
            </label>
            <select
              id="parentId"
              name="parentId"
              value={formData.parentId}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('categories.noParent')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-black">
            {t('categories.description')}
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

        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            {t('categories.categoryImages')}
          </label>
          
          {/* Current Images */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-black mb-2">{t('categories.currentCategoryImages')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {existingImages.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.alt || 'Category image'}
                      className="w-full h-24 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {image.isPrimary && (
                      <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {t('products.primary')}
                      </span>
                    )}
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="absolute bottom-1 left-1 bg-gray-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {t('products.setAsPrimary')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Image Upload Input */}
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
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
                  htmlFor="image-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>{t('categories.uploadCategoryImages')}</span>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                </label>
                <p className="pl-1">{t('products.dragAndDrop')}</p>
              </div>
              <p className="text-xs text-gray-500">{t('products.imageRequirements')}</p>
            </div>
          </div>

          {/* New Images Preview */}
          {images.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-black mb-2">{t('categories.newCategoryImagesToUpload')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {images.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {existingImages.length === 0 && index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {t('products.primary')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/categories"
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )
} 