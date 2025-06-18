'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { Category } from '@/types'

export default function NewProductPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }
    
    if (session.user.role !== 'ADMIN') {
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
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const categoriesData = await response.json()
          setCategories(categoriesData)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError(t('errors.somethingWentWrong'))
      } finally {
        setLoading(false)
      }
    }

    if (session?.user.role === 'ADMIN') {
      fetchCategories()
    }
  }, [t, session])

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
      const response = await fetch('/api/products', {
        method: 'POST',
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
          throw new Error('You are not authorized. Please log in as an admin.')
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid data provided')
        } else {
          throw new Error(errorData.error || 'Failed to create product')
        }
      }

      router.push('/admin/products')
    } catch (error) {
      console.error('Error creating product:', error)
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
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">{t('products.addNewProduct')}</h1>
          <p className="text-black">{t('products.createNewProduct')}</p>
        </div>
        <Link
          href="/admin/products"
          className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('common.back')} {t('products.title')}
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
              {t('products.productName')} *
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
              {t('products.productCategory')} *
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('common.select')} {t('categories.title').toLowerCase()}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-black">
              {t('products.productPrice')} *
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
            {t('products.productDescription')}
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
            href="/admin/products"
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