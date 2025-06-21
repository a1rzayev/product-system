import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch products (public access)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const isExport = searchParams.get('export') === 'true'

    // Check if this is an export request (admin only)
    if (isExport) {
      const session = await getServerSession(authOptions)
      if (!session || !session.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    // For exports, use a larger limit but still reasonable
    const actualLimit = isExport ? Math.min(limit, 5000) : limit

    // Fetch products with category data
    const products = await prisma.product.findMany({
      skip,
      take: actualLimit,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get total count for pagination
    const total = await prisma.product.count()

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit)
      }
    })

  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new product (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'export-large') {
      // Get total count first
      const total = await prisma.product.count()
      
      if (total > 10000) {
        return NextResponse.json({
          error: 'Dataset too large',
          message: 'Cannot export more than 10,000 products at once. Please use filters or contact support.',
          total
        }, { status: 413 })
      }

      // Fetch all products in chunks to avoid memory issues
      const chunkSize = 1000
      const chunks = Math.ceil(total / chunkSize)
      let allProducts: any[] = []

      for (let i = 0; i < chunks; i++) {
        const products = await prisma.product.findMany({
          skip: i * chunkSize,
          take: chunkSize,
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        allProducts = allProducts.concat(products)
      }

      // Prepare data for Excel
      const excelData = allProducts.map((product) => ({
        'ID': product.id,
        'Name': product.name,
        'Description': product.description,
        'Price': product.price,
        'SKU': product.sku,
        'Category': product.category?.name || 'No Category',
        'Status': product.isActive ? 'Active' : 'Inactive',
        'Featured': product.isFeatured ? 'Yes' : 'No',
        'Slug': product.slug,
        'Created At': new Date(product.createdAt).toLocaleDateString(),
        'Updated At': new Date(product.updatedAt).toLocaleDateString()
      }))

      return NextResponse.json({
        success: true,
        data: excelData,
        total,
        message: `Successfully prepared ${total} products for export`
      })
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Products export error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 