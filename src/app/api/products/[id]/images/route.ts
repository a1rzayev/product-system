import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all images for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const images = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(images)

  } catch (error) {
    console.error('Product images fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add new images to a product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    // Create new images
    const images = await prisma.productImage.createMany({
      data: body.images.map((image: any, index: number) => ({
        url: image.url,
        alt: image.alt || '',
        isPrimary: image.isPrimary || false,
        order: image.order || index,
        productId: id
      }))
    })

    // Get the created images
    const createdImages = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(createdImages, { status: 201 })

  } catch (error) {
    console.error('Product images create error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update image order and primary status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Update images in transaction
    const updatedImages = await prisma.$transaction(
      body.images.map((image: any) =>
        prisma.productImage.update({
          where: { id: image.id },
          data: {
            order: image.order,
            isPrimary: image.isPrimary,
            alt: image.alt
          }
        })
      )
    )

    return NextResponse.json(updatedImages)

  } catch (error) {
    console.error('Product images update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 