import { NextResponse } from 'next/server'
import { productService, categoryService, orderService, userService } from '@/lib/db'

export async function GET() {
  try {
    // Fetch all statistics in parallel
    const [products, categories, orders, users] = await Promise.all([
      productService.getAll(1, 1), // Just get pagination info
      categoryService.getAll(),
      orderService.getByUser(''), // This might need adjustment based on your service
      userService.getById(''), // This might need adjustment based on your service
    ])

    const stats = {
      products: products.pagination?.total || 0,
      categories: categories.length || 0,
      orders: 0, // Set to 0 for now, adjust based on your order service
      users: 0, // Set to 0 for now, adjust based on your user service
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { 
        products: 0, 
        categories: 0, 
        orders: 0, 
        users: 0 
      },
      { status: 500 }
    )
  }
} 