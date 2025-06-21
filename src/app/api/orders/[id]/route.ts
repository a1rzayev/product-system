import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const orderId = params.id

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    // Check if user has access to this order
    // Admin can access any order, customer can only access their own
    if (session?.user?.role !== 'ADMIN') {
      if (!session?.user?.id || order.customerId !== session.user.id) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    // Parse billing and shipping addresses from JSON strings
    const billingInfo = JSON.parse(order.billingAddress || '{}')
    const shippingInfo = JSON.parse(order.shippingAddress || '{}')

    // Transform order data for frontend
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      orderDate: order.createdAt,
      billingInfo: billingInfo,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        sku: item.product.sku,
        image: item.product.images?.[0]?.url
      }))
    }

    return NextResponse.json(transformedOrder)

  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 