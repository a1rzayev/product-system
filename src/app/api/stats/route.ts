import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch all statistics in parallel using Prisma
    const [products, categories, orders, users] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.user.count(),
    ])

    const stats = {
      products,
      categories,
      orders,
      users,
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