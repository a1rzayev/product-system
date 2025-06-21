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

    // Search and filter parameters
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const featured = searchParams.get('featured') === 'true'
    const active = searchParams.get('active') !== 'false' // Default to true

    // Check if this is an export request (admin only)
    if (isExport) {
      const session = await getServerSession(authOptions)
      if (!session || !session.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    // For exports, use a larger limit but still reasonable
    const actualLimit = isExport ? Math.min(limit, 5000) : limit

    // Build where clause for filtering
    const where: any = {
      isActive: active
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } }
      ]
    }

    // Category filter
    if (category) {
      where.categoryId = category
    }

    // Price range filter
    if (minPrice !== null || maxPrice !== null) {
      where.price = {}
      if (minPrice !== null) where.price.gte = minPrice
      if (maxPrice !== null) where.price.lte = maxPrice
    }

    // Featured filter
    if (featured) {
      where.isFeatured = true
    }

    // Build order by clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder
        break
      case 'price':
        orderBy.price = sortOrder
        break
      case 'createdAt':
        orderBy.createdAt = sortOrder
        break
      case 'updatedAt':
        orderBy.updatedAt = sortOrder
        break
      default:
        orderBy.createdAt = 'desc'
    }

    // Fetch products with category data
    const products = await prisma.product.findMany({
      where,
      skip,
      take: actualLimit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          where: { isPrimary: true },
          take: 1
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy
    })

    // Get total count for pagination
    const total = await prisma.product.count({ where })

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit)
      },
      filters: {
        search,
        category,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
        featured,
        active
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