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

    // Fetch revenue statistics
    const revenueStats = await prisma.order.aggregate({
      _sum: {
        total: true,
        subtotal: true,
        tax: true,
        shipping: true,
        discount: true,
      },
      _avg: {
        total: true,
      },
      _count: {
        id: true,
      },
    })

    // Get recent orders (last 10)
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    // Get top products by order count
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: true,
        },
      },
      take: 5,
    })

    // Get top products with product details
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        })
        return {
          ...product,
          totalSold: item._sum.quantity || 0,
        }
      })
    )

    // Get orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    // Get monthly revenue for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyRevenue = await prisma.order.groupBy({
      by: ['createdAt'],
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Process monthly revenue data
    const monthlyData = monthlyRevenue.reduce((acc, item) => {
      const month = new Date(item.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
      acc[month] = (acc[month] || 0) + (item._sum.total || 0)
      return acc
    }, {} as Record<string, number>)

    // Get active vs inactive products
    const productStatus = await prisma.product.groupBy({
      by: ['isActive'],
      _count: {
        id: true,
      },
    })

    // Get featured products count
    const featuredProducts = await prisma.product.count({
      where: {
        isFeatured: true,
      },
    })

    // Get user roles distribution
    const userRoles = await prisma.user.groupBy({
      by: ['role'],
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
        subtotal: revenueStats._sum.subtotal || 0,
        tax: revenueStats._sum.tax || 0,
        shipping: revenueStats._sum.shipping || 0,
        discount: revenueStats._sum.discount || 0,
        average: revenueStats._avg.total || 0,
        orderCount: revenueStats._count.id || 0,
      },
      
      // Recent orders
      recentOrders,
      
      // Top products
      topProducts: topProductsWithDetails,
      
      // Orders by status
      ordersByStatus,
      
      // Monthly revenue
      monthlyRevenue: monthlyData,
      
      // Product status
      productStatus,
      featuredProducts,
      
      // User roles
      userRoles,
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
          subtotal: 0,
          tax: 0,
          shipping: 0,
          discount: 0,
          average: 0,
          orderCount: 0,
        },
        recentOrders: [],
        topProducts: [],
        ordersByStatus: [],
        monthlyRevenue: {},
        productStatus: [],
        featuredProducts: 0,
        userRoles: [],
      },
      { status: 500 }
    )
  }
} 