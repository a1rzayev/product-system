import { productService, categoryService, orderService, userService } from '@/lib/db'

export default async function AdminDashboard() {
  // Fetch dashboard statistics
  const [products, categories, orders, users] = await Promise.all([
    productService.getAll(1, 1), 
    categoryService.getAll(),
    orderService.getByUser(''), 
    userService.getById(''), 
  ])

  const stats = [
    {
      name: 'Total Products',
      value: products.pagination.total,
      icon: '📦',
      color: 'bg-blue-500'
    },
    {
      name: 'Categories',
      value: categories.length,
      icon: '🏷️',
      color: 'bg-green-500'
    },
    {
      name: 'Total Orders',
      value: '0', 
      icon: '📋',
      color: 'bg-yellow-500'
    },
    {
      name: 'Users',
      value: '0', 
      icon: '👥',
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your product system admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/products/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">➕</span>
              <div>
                <h3 className="font-medium text-gray-900">Add Product</h3>
                <p className="text-sm text-gray-600">Create a new product</p>
              </div>
            </a>
            <a
              href="/admin/categories/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">🏷️</span>
              <div>
                <h3 className="font-medium text-gray-900">Add Category</h3>
                <p className="text-sm text-gray-600">Create a new category</p>
              </div>
            </a>
            <a
              href="/admin/orders"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">📋</span>
              <div>
                <h3 className="font-medium text-gray-900">View Orders</h3>
                <p className="text-sm text-gray-600">Manage customer orders</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-8">
            <p>No recent activity to display</p>
            <p className="text-sm">Activity will appear here as you use the system</p>
          </div>
        </div>
      </div>
    </div>
  )
} 