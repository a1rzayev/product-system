'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useCart } from '@/contexts/CartContext'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  description: string
  price: number
  comparePrice?: number
  slug: string
  sku: string
  isActive: boolean
  isFeatured: boolean
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  category?: {
    id: string
    name: string
    slug: string
  }
  images?: Array<{ url: string; alt?: string; isPrimary: boolean }>
  createdAt: string
  updatedAt: string
}

export default function ProductPage() {
  const { t } = useLanguage()
  const { addItem } = useCart()
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found')
          }
          throw new Error('Failed to fetch product')
        }
        const data = await response.json()
        setProduct(data)
      } catch (error) {
        console.error('Error fetching product:', error)
        setError(error instanceof Error ? error.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const formatDimensions = (dimensions: any) => {
    if (!dimensions) return 'N/A'
    return `${dimensions.length} × ${dimensions.width} × ${dimensions.height} cm`
  }

  const handleAddToCart = () => {
    if (!product) return
    
    // Check if user is authenticated
    if (!session?.user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/products/${productId}`)
      return
    }
    
    setIsAddingToCart(true)
    
    // Simulate API call delay
    setTimeout(() => {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        image: product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url,
        sku: product.sku
      })
      
      setIsAddingToCart(false)
      
      // Show success message (you could add a toast notification here)
      alert(t('cart.itemAdded') || 'Item added to cart!')
    }, 500)
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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('products.productNotFound')}</h1>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ← {t('products.backToProducts')}
          </Link>
        </div>
      </div>
    )
  }

  if (!product.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('products.productUnavailable')}</h1>
          <p className="text-gray-600 mb-4">{t('products.productNotAvailable')}</p>
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ← {t('products.backToProducts')}
          </Link>
        </div>
      </div>
    )
  }

  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0]
  const otherImages = product.images?.filter(img => !img.isPrimary) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <Link href="/products" className="text-gray-700 hover:text-blue-600">
                  Products
                </Link>
              </div>
            </li>
            {product.category && (
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <Link href={`/categories/${product.category.slug}`} className="text-gray-700 hover:text-blue-600">
                    {product.category.name}
                  </Link>
                </div>
              </li>
            )}
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-w-1 aspect-h-1 w-full">
                {primaryImage ? (
                  <img
                    src={primaryImage.url}
                    alt={primaryImage.alt || product.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-6xl">📦</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {otherImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {otherImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index + 1)}
                      className="aspect-w-1 aspect-h-1 w-full"
                    >
                      <img
                        src={image.url}
                        alt={image.alt || `${product.name} ${index + 2}`}
                        className="w-full h-20 object-cover rounded-lg hover:opacity-75 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Product Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                {product.category && (
                  <Link
                    href={`/categories/${product.category.slug}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {product.category.name}
                  </Link>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                )}
                {product.isFeatured && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {t('products.featured')}
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('products.description')}</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Product Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('products.productInformation')}</h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">SKU</dt>
                    <dd className="text-sm text-gray-900">{product.sku}</dd>
                  </div>
                  {product.weight && (
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">{t('products.weight')}</dt>
                      <dd className="text-sm text-gray-900">{product.weight}g</dd>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">{t('products.dimensions')}</dt>
                      <dd className="text-sm text-gray-900">{formatDimensions(product.dimensions)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">{t('products.status')}</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? t('products.active') : t('products.inactive')}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center space-x-4">
                    <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                      {t('cart.quantity') || 'Quantity'}:
                    </label>
                    <select
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button 
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || !product.isActive}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isAddingToCart ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('cart.adding') || 'Adding...'}
                        </>
                      ) : (
                        t('products.addToCart') || 'Add to Cart'
                      )}
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors">
                      {t('products.addToWishlist') || 'Add to Wishlist'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Back to Products */}
              <div className="text-center">
                <Link
                  href="/products"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← {t('products.backToProducts')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 