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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const isExport = searchParams.get('export') === 'true'

    // For exports, use a larger limit but still reasonable
    const actualLimit = isExport ? Math.min(limit, 5000) : limit

    // Fetch orders with customer and items data
    const orders = await prisma.order.findMany({
      skip,
      take: actualLimit,
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
                sku: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get total count for pagination
    const total = await prisma.order.count()

    return NextResponse.json({
      data: orders,
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit)
      }
    })

  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Handle admin export action
    if (action === 'export-large') {
      if (!session || !session.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }

      // Get total count first
      const total = await prisma.order.count()
      
      if (total > 10000) {
        return NextResponse.json({
          error: 'Dataset too large',
          message: 'Cannot export more than 10,000 orders at once. Please use filters or contact support.',
          total
        }, { status: 413 })
      }

      // Fetch all orders in chunks to avoid memory issues
      const chunkSize = 1000
      const chunks = Math.ceil(total / chunkSize)
      let allOrders: any[] = []

      for (let i = 0; i < chunks; i++) {
        const orders = await prisma.order.findMany({
          skip: i * chunkSize,
          take: chunkSize,
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
                    sku: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        allOrders = allOrders.concat(orders)
      }

      // Prepare data for Excel
      const excelData = allOrders.map((order) => ({
        'Order ID': order.id,
        'Order Number': order.orderNumber,
        'Customer Name': order.customer?.name || 'No Name',
        'Customer Email': order.customer?.email || 'No Email',
        'Status': order.status,
        'Total': order.total,
        'Subtotal': order.subtotal,
        'Tax': order.tax,
        'Shipping': order.shipping,
        'Discount': order.discount,
        'Items Count': order.items?.length || 0,
        'Shipping City': JSON.parse(order.shippingAddress || '{}').city || 'N/A',
        'Shipping Country': JSON.parse(order.shippingAddress || '{}').country || 'N/A',
        'Notes': order.notes || 'No Notes',
        'Created At': new Date(order.createdAt).toLocaleDateString(),
        'Updated At': new Date(order.updatedAt).toLocaleDateString()
      }))

      return NextResponse.json({
        success: true,
        data: excelData,
        total,
        message: `Successfully prepared ${total} orders for export`
      })
    }

    // Handle customer order creation - require authentication
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { items, total, billingInfo } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'No items provided' }, { status: 400 })
    }

    if (!billingInfo) {
      return NextResponse.json({ message: 'Billing information required' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          status: 'CONFIRMED',
          total,
          subtotal: total,
          tax: 0,
          shipping: 0,
          discount: 0,
          customerId: session.user.id, // Use authenticated user's ID
          billingAddress: JSON.stringify({
            firstName: billingInfo.firstName,
            lastName: billingInfo.lastName,
            email: billingInfo.email,
            phone: billingInfo.phone,
            address: billingInfo.address,
            city: billingInfo.city,
            state: billingInfo.state,
            zipCode: billingInfo.zipCode,
            country: billingInfo.country
          }),
          shippingAddress: JSON.stringify({
            firstName: billingInfo.firstName,
            lastName: billingInfo.lastName,
            email: billingInfo.email,
            phone: billingInfo.phone,
            address: billingInfo.address,
            city: billingInfo.city,
            state: billingInfo.state,
            zipCode: billingInfo.zipCode,
            country: billingInfo.country
          }),
          notes: 'Order placed through checkout'
        }
      })

      // Create order items
      const orderItems = await Promise.all(
        items.map((item: any) =>
          tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }
          })
        )
      )

      return {
        ...newOrder,
        items: orderItems
      }
    })

    return NextResponse.json(order, { status: 201 })

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 