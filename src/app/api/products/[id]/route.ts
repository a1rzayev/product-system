import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Fetch product with category and images
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
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
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)

  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        slug: body.slug,
        sku: body.sku,
        price: body.price,
        comparePrice: body.comparePrice,
        categoryId: body.categoryId,
        isActive: body.isActive,
        isFeatured: body.isFeatured,
        weight: body.weight,
        dimensions: body.dimensions ? JSON.stringify(body.dimensions) : null
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

    return NextResponse.json(updatedProduct)

  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Delete product (this will cascade delete related data)
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })

  } catch (error) {
    console.error('Product delete error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 