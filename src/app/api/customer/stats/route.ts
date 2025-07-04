import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Get statistics for the customer's products
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      totalOrders
    ] = await Promise.all([
      // Total products (all products for now, could be filtered by customer later)
      prisma.product.count(),
      
      // Active products
      prisma.product.count({
        where: { isActive: true }
      }),
      
      // Featured products
      prisma.product.count({
        where: { isFeatured: true }
      }),
      
      // Total orders (all orders for now, could be filtered by customer later)
      prisma.order.count()
    ])

    return NextResponse.json({
      totalProducts,
      activeProducts,
      featuredProducts,
      totalOrders
    })

  } catch (error) {
    console.error('Customer stats error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 