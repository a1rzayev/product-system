import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function saveImage(file: File): Promise<string> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Create products subdirectory
    const productsDir = join(uploadsDir, 'products')
    if (!existsSync(productsDir)) {
      await mkdir(productsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const filename = `${timestamp}-${randomString}.${fileExtension}`
    
    // Full path for saving
    const filePath = join(productsDir, filename)
    
    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Save file
    await writeFile(filePath, buffer)
    
    // Return the public URL
    return `/uploads/products/${filename}`
  } catch (error) {
    console.error('Error saving image:', error)
    throw new Error('Failed to save image')
  }
}

export async function saveMultipleImages(files: File[]): Promise<Array<{
  url: string
  alt: string
  isPrimary: boolean
  order: number
}>> {
  const savedImages = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const url = await saveImage(file)
    
    savedImages.push({
      url,
      alt: file.name,
      isPrimary: i === 0, // First image is primary
      order: i
    })
  }
  
  return savedImages
} 