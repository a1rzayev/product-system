'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { useSession } from 'next-auth/react'
import SearchBar from '@/components/SearchBar'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Product {
  id: string
  name: string
  description: string
  price: number
  comparePrice?: number
  slug: string
  images?: Array<{ url: string; alt?: string }>
  category?: { name: string; slug: string }
  isFeatured: boolean
  _count?: { reviews: number }
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function ProductsPage() {
  const { t } = useLanguage()
  const { addItem } = useCart()
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
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
        const response = await fetch('/api/categories?limit=100')
        if (response.ok) {
          const result = await response.json()
          setCategories(result.data || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    const fetchProducts = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams(searchParams.toString())
        const response = await fetch(`/api/products?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        const result = await response.json()
        setProducts(result.data || [])
        setPagination(result.pagination || { page: 1, total: 0, totalPages: 0 })
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
    fetchProducts()
  }, [searchParams])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault() // Prevent navigation to product detail page
    e.stopPropagation()
    
    // Check if user is authenticated
    if (!session?.user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/products`)
      return
    }
    
    setAddingToCart(product.id)
    
    // Simulate API call delay
    setTimeout(() => {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.images?.[0]?.url,
        sku: product.slug // Using slug as SKU for now
      })
      
      setAddingToCart(null)
      
      // Show success message
      alert(t('cart.itemAdded') || 'Item added to cart!')
    }, 500)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/products?${params.toString()}`)
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('products.title')}</h1>
          <p className="text-gray-600">
            {pagination.total} {pagination.total === 1 ? 'product' : 'products'} found
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <SearchBar
            placeholder={t('products.searchPlaceholder') || 'Search products...'}
            showFilters={true}
            showSorting={true}
            categories={categories}
            pathname="/products"
          />
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('products.noProductsFound') || 'No products found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('products.tryDifferentSearch') || 'Try adjusting your search or filters'}
            </p>
            <button
              onClick={() => router.push('/products')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {t('common.clearFilters') || 'Clear all filters'}
            </button>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="aspect-w-1 aspect-h-1 w-full">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].alt || product.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-4xl">📦</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(product.price)}
                          </span>
                          {product.comparePrice && product.comparePrice > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(product.comparePrice)}
                            </span>
                          )}
                        </div>
                        {product.isFeatured && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {t('products.featured')}
                          </span>
                        )}
                      </div>
                      
                      {product.category && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {product.category.name}
                          </span>
                        </div>
                      )}

                      {product._count?.reviews && (
                        <div className="mb-3 text-sm text-gray-500">
                          ⭐ {product._count.reviews} {t('products.reviews') || 'reviews'}
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  {/* Add to Cart Button */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={addingToCart === product.id}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {addingToCart === product.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('cart.adding') || 'Adding...'}
                        </>
                      ) : (
                        t('products.addToCart') || 'Add to Cart'
                      )}
                    </button>
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