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

    // Get session to check user role
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    // For exports, use a larger limit but still reasonable
    const actualLimit = isExport ? Math.min(limit, 5000) : limit

    // Build where clause for filtering
    const where: any = {}

    // Only filter by active status for non-admin users
    if (!isAdmin) {
      where.isActive = active
    } else {
      // For admins, respect the active filter if explicitly set
      if (searchParams.has('active')) {
        where.isActive = active
      }
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

    // Handle product creation
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.slug || !body.sku || !body.categoryId || !body.price) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, sku, categoryId, price' },
        { status: 400 }
      )
    }

    // Check if slug or sku already exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: body.slug },
          { sku: body.sku }
        ]
      }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug or SKU already exists' },
        { status: 400 }
      )
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: body.categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      )
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description || '',
        slug: body.slug,
        sku: body.sku,
        price: parseFloat(body.price),
        comparePrice: body.comparePrice ? parseFloat(body.comparePrice) : null,
        isActive: body.isActive !== undefined ? body.isActive : true,
        isFeatured: body.isFeatured !== undefined ? body.isFeatured : false,
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions ? JSON.stringify(body.dimensions) : null,
        categoryId: body.categoryId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Product created successfully',
      product
    }, { status: 201 })

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 