import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface UploadResult {
  success: boolean
  filename?: string
  path?: string
  error?: string
}

export async function uploadFile(
  file: File,
  folder: string = 'logos',
  maxSize: number = 5 * 1024 * 1024, // 5MB
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
): Promise<UploadResult> {
  try {
    // Validasi file
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validasi size
    if (file.size > maxSize) {
      return { success: false, error: 'File size too large. Maximum size is 5MB' }
    }

    // Validasi type
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP'
      }
    }

    // Generate unique filename
    const extension = file.name.split('.').pop()?.toLowerCase()
    const uniqueFilename = `${uuidv4()}.${extension}`

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads', folder)
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Write file to disk
    const filePath = join(uploadsDir, uniqueFilename)
    await writeFile(filePath, buffer)

    // Return relative path for database storage
    const relativePath = `/uploads/${folder}/${uniqueFilename}`

    return {
      success: true,
      filename: uniqueFilename,
      path: relativePath
    }

  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

export async function deleteFile(path: string): Promise<boolean> {
  try {
    const fs = require('fs/promises')
    const fullPath = join(process.cwd(), 'public', path)
    await fs.unlink(fullPath)
    return true
  } catch (error) {
    console.error('Delete file error:', error)
    return false
  }
}