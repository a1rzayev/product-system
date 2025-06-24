import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch basic counts
    const [products, categories, orders, users] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.user.count(),
    ])

    // Get sold products by category
    const soldProductsByCategory = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
    })

    // Get category data for sold products
    const categorySales = await Promise.all(
      soldProductsByCategory.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
        return {
          productId: item.productId,
          categoryId: product?.categoryId,
          categoryName: product?.category?.name || 'Unknown',
          totalSold: item._sum.quantity || 0,
        }
      })
    )

    // Group by category
    const categoryStats = categorySales.reduce((acc, item) => {
      const categoryName = item.categoryName
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          totalSold: 0,
          productCount: 0,
        }
      }
      acc[categoryName].totalSold += item.totalSold
      acc[categoryName].productCount += 1
      return acc
    }, {} as Record<string, { name: string; totalSold: number; productCount: number }>)

    // Convert to array and sort by total sold
    const categorySalesArray = Object.values(categoryStats).sort((a, b) => b.totalSold - a.totalSold)

    // Get basic revenue stats
    const revenueStats = await prisma.order.aggregate({
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    })

    const stats = {
      // Basic counts
      products,
      categories,
      orders,
      users,
      
      // Revenue statistics
      revenue: {
        total: revenueStats._sum.total || 0,
        orderCount: revenueStats._count.id || 0,
      },
      
      // Category sales
      categorySales: categorySalesArray,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { 
        products: 0, 
        categories: 0, 
        orders: 0, 
        users: 0,
        revenue: {
          total: 0,
          orderCount: 0,
        },
        categorySales: [],
      },
      { status: 500 }
    )
  }
} 