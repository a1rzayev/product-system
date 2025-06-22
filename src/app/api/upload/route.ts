import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { saveMultipleImages } from '@/lib/upload'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called')
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      console.log('Non-admin access attempt')
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    console.log('Files received:', files.length)

    if (!files || files.length === 0) {
      console.log('No files provided')
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    if (files.length > 10) {
      console.log('Too many files:', files.length)
      return NextResponse.json({ error: 'Maximum 10 images allowed' }, { status: 400 })
    }

    // Validate files
    for (const file of files) {
      console.log('Processing file:', file.name, file.type, file.size)
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log('Invalid file type:', file.type)
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log('File too large:', file.size)
        return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
      }
    }

    // Save images to filesystem
    console.log('Saving images to filesystem...')
    const uploadedImages = await saveMultipleImages(files)
    console.log('Images saved successfully:', uploadedImages.length)

    return NextResponse.json({
      message: 'Images uploaded successfully',
      images: uploadedImages
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 