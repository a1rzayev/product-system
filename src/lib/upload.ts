import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function saveImage(file: File, folder: string = 'products'): Promise<string> {
  try {
    console.log(`Saving image to folder: ${folder}`)
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    console.log('Uploads directory:', uploadsDir)
    
    if (!existsSync(uploadsDir)) {
      console.log('Creating uploads directory...')
      await mkdir(uploadsDir, { recursive: true })
    }

    // Create folder-specific subdirectory
    const folderDir = join(uploadsDir, folder)
    console.log('Folder directory:', folderDir)
    
    if (!existsSync(folderDir)) {
      console.log(`Creating ${folder} directory...`)
      await mkdir(folderDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const filename = `${timestamp}-${randomString}.${fileExtension}`
    
    // Full path for saving
    const filePath = join(folderDir, filename)
    console.log('Saving file to:', filePath)
    
    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Save file
    await writeFile(filePath, buffer)
    console.log('File saved successfully')
    
    // Return the public URL
    const publicUrl = `/uploads/${folder}/${filename}`
    console.log('Public URL:', publicUrl)
    return publicUrl
  } catch (error) {
    console.error('Error saving image:', error)
    throw new Error('Failed to save image')
  }
}

export async function saveMultipleImages(files: File[], folder: string = 'products'): Promise<Array<{
  url: string
  alt: string
  isPrimary: boolean
  order: number
}>> {
  const savedImages = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const url = await saveImage(file, folder)
    
    savedImages.push({
      url,
      alt: file.name,
      isPrimary: i === 0, // First image is primary
      order: i
    })
  }
  
  return savedImages
} 