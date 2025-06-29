import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper to parse dimensions
function parseProductDimensions(product: any): any {
  if (!product) return product
  return {
    ...product,
    dimensions: product.dimensions ? JSON.parse(product.dimensions) : undefined
  }
}

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

    // Parse dimensions before returning
    const parsedProduct = parseProductDimensions(product)

    return NextResponse.json(parsedProduct)

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
        dimensions: body.dimensions ? JSON.stringify(body.dimensions) : null,
        notes: body.notes
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

    // Parse dimensions before returning
    const parsedProduct = parseProductDimensions(updatedProduct)

    return NextResponse.json(parsedProduct)

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