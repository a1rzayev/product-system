import Link from 'next/link'
import { categoryService } from '@/lib/db'
import CategoryTable from '@/components/admin/CategoryTable'

export default async function AdminCategories() {
  const categories = await categoryService.getAll()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage your product categories</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Category
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Categories</h2>
          <p className="text-sm text-gray-600">
            {categories.length} categories total
          </p>
        </div>
        <CategoryTable categories={categories} />
      </div>
    </div>
  )
} 