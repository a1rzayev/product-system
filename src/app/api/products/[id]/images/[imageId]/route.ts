import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Delete a specific image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id, imageId } = params

    // Verify the image belongs to the product
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId: id
      }
    })

    if (!image) {
      return NextResponse.json(
        { message: 'Image not found' },
        { status: 404 }
      )
    }

    // Delete the image
    await prisma.productImage.delete({
      where: { id: imageId }
    })

    return NextResponse.json({ message: 'Image deleted successfully' })

  } catch (error) {
    console.error('Product image delete error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 