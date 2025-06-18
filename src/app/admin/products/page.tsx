import Link from 'next/link'
import { productService } from '@/lib/db'
import ProductTable from '@/components/admin/ProductTable'

export default async function AdminProducts() {
  const products = await productService.getAll(1, 50)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Product
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Products</h2>
          <p className="text-sm text-gray-600">
            {products.pagination.total} products total
          </p>
        </div>
        <ProductTable products={products.data} />
      </div>
    </div>
  )
} 