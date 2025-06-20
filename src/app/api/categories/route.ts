import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch categories
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

    // Fetch categories with parent and children data
    const categories = await prisma.category.findMany({
      skip,
      take: actualLimit,
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        children: {
          select: {
            id: true,
            name: true
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

    // Get total count for pagination
    const total = await prisma.category.count()

    return NextResponse.json({
      data: categories,
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit)
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

// POST - Create a new category
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

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Categories export error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 