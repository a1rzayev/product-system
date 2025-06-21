'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

interface SearchBarProps {
  placeholder?: string
  showFilters?: boolean
  showSorting?: boolean
  categories?: Array<{ id: string; name: string; slug: string }>
  onSearch?: (searchTerm: string) => void
  className?: string
  pathname?: string
}

export default function SearchBar({
  placeholder = 'Search...',
  showFilters = false,
  showSorting = false,
  categories = [],
  onSearch,
  className = '',
  pathname = '/products'
}: SearchBarProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    featured: searchParams.get('featured') === 'true',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    } else {
      params.delete('search')
    }
    
    // Apply filters
    if (filters.category) {
      params.set('category', filters.category)
    } else {
      params.delete('category')
    }
    
    if (filters.minPrice) {
      params.set('minPrice', filters.minPrice)
    } else {
      params.delete('minPrice')
    }
    
    if (filters.maxPrice) {
      params.set('maxPrice', filters.maxPrice)
    } else {
      params.delete('maxPrice')
    }
    
    if (filters.featured) {
      params.set('featured', 'true')
    } else {
      params.delete('featured')
    }
    
    if (filters.sortBy) {
      params.set('sortBy', filters.sortBy)
    }
    
    if (filters.sortOrder) {
      params.set('sortOrder', filters.sortOrder)
    }
    
    // Reset to first page when searching
    params.set('page', '1')
    
    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname
    router.push(url)
    
    if (onSearch) {
      onSearch(searchTerm.trim())
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      featured: false,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    router.push(pathname)
  }

  const hasActiveFilters = searchTerm || filters.category || filters.minPrice || filters.maxPrice || filters.featured

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder:text-black"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('common.search') || 'Search'}
        </button>
        {showFilters && (
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('common.filters') || 'Filters'}
          </button>
        )}
      </form>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-black">
          <span>{t('common.activeFilters') || 'Active filters:'}</span>
          {searchTerm && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Search: {searchTerm}
            </span>
          )}
          {filters.category && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
              Category: {categories.find(c => c.id === filters.category)?.name || filters.category}
            </span>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              Price: ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
            </span>
          )}
          {filters.featured && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
              Featured only
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-red-600 hover:text-red-800 underline"
          >
            {t('common.clearAll') || 'Clear all'}
          </button>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && showAdvancedFilters && (
        <div className="bg-gray-50 p-4 rounded-md space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                {t('categories.title') || 'Category'}
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="">{t('common.allCategories') || 'All Categories'}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                {t('common.minPrice') || 'Min Price'}
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                {t('common.maxPrice') || 'Max Price'}
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                placeholder="∞"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black"
              />
            </div>

            {/* Featured Filter */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                {t('common.featured') || 'Featured'}
              </label>
              <label className="flex items-center text-black">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => setFilters({ ...filters, featured: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-black">
                  {t('common.featuredOnly') || 'Featured only'}
                </span>
              </label>
            </div>
          </div>

          {/* Sorting Options */}
          {showSorting && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  {t('common.sortBy') || 'Sort by'}
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="createdAt">{t('common.newest') || 'Newest'}</option>
                  <option value="name">{t('common.name') || 'Name'}</option>
                  <option value="price">{t('common.price') || 'Price'}</option>
                  <option value="updatedAt">{t('common.updated') || 'Updated'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  {t('common.order') || 'Order'}
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="desc">{t('common.descending') || 'Descending'}</option>
                  <option value="asc">{t('common.ascending') || 'Ascending'}</option>
                </select>
              </div>
            </div>
          )}

          {/* Apply Filters Button */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {t('common.applyFilters') || 'Apply Filters'}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {t('common.clear') || 'Clear'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 