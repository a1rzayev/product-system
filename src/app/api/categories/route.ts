import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch categories (public access)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const isExport = searchParams.get('export') === 'true'

    // Search and filter parameters
    const search = searchParams.get('search') || ''
    const parentId = searchParams.get('parentId') || ''
    const hasProducts = searchParams.get('hasProducts') === 'true'
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

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
    const where: any = {}

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { slug: { contains: search } }
      ]
    }

    // Parent category filter
    if (parentId) {
      if (parentId === 'null') {
        where.parentId = null // Top-level categories
      } else {
        where.parentId = parentId
      }
    }

    // Categories with products filter
    if (hasProducts) {
      where.products = {
        some: {}
      }
    }

    // Build order by clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'name':
        orderBy.name = sortOrder
        break
      case 'createdAt':
        orderBy.createdAt = sortOrder
        break
      case 'updatedAt':
        orderBy.updatedAt = sortOrder
        break
      default:
        orderBy.name = 'asc'
    }

    // Fetch categories with parent and children data
    const categories = await prisma.category.findMany({
      where,
      skip,
      take: actualLimit,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      },
      orderBy
    })

    // Get total count for pagination
    const total = await prisma.category.count({ where })

    return NextResponse.json({
      data: categories,
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit)
      },
      filters: {
        search,
        parentId,
        hasProducts,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new category (admin only)
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
      const total = await prisma.category.count()
      
      if (total > 10000) {
        return NextResponse.json({
          error: 'Dataset too large',
          message: 'Cannot export more than 10,000 categories at once. Please use filters or contact support.',
          total
        }, { status: 413 })
      }

      // Fetch all categories in chunks to avoid memory issues
      const chunkSize = 1000
      const chunks = Math.ceil(total / chunkSize)
      let allCategories: any[] = []

      for (let i = 0; i < chunks; i++) {
        const categories = await prisma.category.findMany({
          skip: i * chunkSize,
          take: chunkSize,
          include: {
            parent: {
              select: {
                id: true,
                name: true
              }
            },
            images: {
              orderBy: {
                order: 'asc'
              }
            },
            _count: {
              select: {
                products: true,
                children: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        allCategories = allCategories.concat(categories)
      }

      // Prepare data for Excel
      const excelData = allCategories.map((category) => ({
        'ID': category.id,
        'Name': category.name,
        'Description': category.description || 'No Description',
        'Slug': category.slug,
        'Parent Category': category.parent?.name || 'No Parent',
        'Products Count': category._count?.products || 0,
        'Subcategories Count': category._count?.children || 0,
        'Created At': new Date(category.createdAt).toLocaleDateString(),
        'Updated At': new Date(category.updatedAt).toLocaleDateString()
      }))

      return NextResponse.json({
        success: true,
        data: excelData,
        total,
        message: `Successfully prepared ${total} categories for export`
      })
    }

    // Create new category
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { message: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug: body.slug }
    })

    if (existingCategory) {
      return NextResponse.json(
        { message: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    // Import categoryService
    const { categoryService } = await import('@/lib/db')

    // Create the category
    const category = await categoryService.create({
      name: body.name,
      description: body.description || '',
      slug: body.slug,
      parentId: body.parentId || null,
      notes: body.notes || null,
      images: body.images || []
    })

    return NextResponse.json({
      message: 'Category created successfully',
      category
    }, { status: 201 })

  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 