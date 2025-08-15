// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import pool from "@/lib/db"
import fs from 'fs'
import path from "path"

// POST /api/resources/download - Handle resource downloads
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { resourceId } = await request.json()
    
    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    // Check if resource exists and get file path
    const resourceResult = await pool.query(
      'SELECT resource_id, title, file_path, type FROM resources WHERE resource_id = $1 AND is_published = true',
      [resourceId]
    )

    if (resourceResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      )
    }

    const resource = resourceResult.rows[0]

    // Track download
    try {
      await pool.query(
        'INSERT INTO resource_downloads (resource_id, user_id, downloaded_at) VALUES ($1, $2, NOW())',
        [resourceId, user.user_id]
      )
    } catch (error) {
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS resource_downloads (
            download_id SERIAL PRIMARY KEY,
            resource_id INTEGER REFERENCES resources(resource_id),
            user_id INTEGER REFERENCES users(user_id),
            downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)
        
        await pool.query(
          'INSERT INTO resource_downloads (resource_id, user_id, downloaded_at) VALUES ($1, $2, NOW())',
          [resourceId, user.user_id]
        )
      }
    }

    // Get additional resource details for content generation
    const resourceDetailsResult = await pool.query(
      'SELECT title, description, content, type FROM resources WHERE resource_id = $1',
      [resourceId]
    )
    
    const resourceDetails = resourceDetailsResult.rows[0]

    // Priority 1: Try to serve actual uploaded file if file_path exists
    if (resource.file_path) {
      let filePath = resource.file_path
      
      // Clean the file path - remove leading slashes and normalize
      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1)
      }
      
      const fullPath = path.join(process.cwd(), 'public', filePath)
      console.log('Attempting to read file from:', fullPath)
      
      try {
        if (fs.existsSync(fullPath)) {
          const fileBuffer = fs.readFileSync(fullPath)
          const fileExtension = path.extname(fullPath).toLowerCase()
          const originalFilename = path.basename(fullPath)
          
          // Set appropriate content type and filename
          let contentType = 'application/octet-stream'
          let filename = originalFilename || `${resource.title}.txt`
          
          if (fileExtension === '.pdf') {
            contentType = 'application/pdf'
            filename = originalFilename || `${resource.title}.pdf`
          } else if (fileExtension === '.txt') {
            contentType = 'text/plain'
            filename = originalFilename || `${resource.title}.txt`
          } else if (fileExtension === '.doc') {
            contentType = 'application/msword'
            filename = originalFilename || `${resource.title}.doc`
          } else if (fileExtension === '.docx') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            filename = originalFilename || `${resource.title}.docx`
          } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
            contentType = 'image/jpeg'
            filename = originalFilename || `${resource.title}.jpg`
          } else if (fileExtension === '.png') {
            contentType = 'image/png'
            filename = originalFilename || `${resource.title}.png`
          } else if (fileExtension === '.mp4') {
            contentType = 'video/mp4'
            filename = originalFilename || `${resource.title}.mp4`
          } else if (fileExtension === '.mp3') {
            contentType = 'audio/mpeg'
            filename = originalFilename || `${resource.title}.mp3`
          }
          
          // Update download count
          try {
            await pool.query(
              'UPDATE resources SET downloads = COALESCE(downloads, 0) + 1 WHERE resource_id = $1',
              [resourceId]
            )
          } catch (dbError) {
            console.error('Error updating download count:', dbError)
          }
          
          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Cache-Control': 'no-cache',
              'Content-Length': fileBuffer.length.toString()
            }
          })
        } else {
          console.log('File does not exist at path:', fullPath)
        }
      } catch (fileError) {
        console.error('Error reading file:', fileError)
      }
    }

    // Priority 2: If no file found or file doesn't exist, provide fallback content
    console.log('No file found or file does not exist, providing fallback content')
    
    // If file doesn't exist or no file_path, fall back to generating content
    const fallbackContent = `${resourceDetails.title}\n${'='.repeat(resourceDetails.title.length)}\n\nDescription:\n${resourceDetails.description || 'No description available'}\n\nContent:\n${resourceDetails.content || 'No additional content available'}\n\nNote: The original file could not be found, but the content is provided above.\n\nThis resource was downloaded from MindCare Hub.`
    const fallbackFileName = `${resourceDetails.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_content.txt`
    const fallbackBuffer = Buffer.from(fallbackContent, 'utf-8')
    
    // Update download count even for fallback
    try {
      await pool.query(
        'UPDATE resources SET downloads = COALESCE(downloads, 0) + 1 WHERE resource_id = $1',
        [resourceId]
      )
    } catch (updateError) {
      console.log('Could not update download count:', updateError)
    }
    
    return new NextResponse(fallbackBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${fallbackFileName}"`,
        'Content-Length': fallbackBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Download tracking error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}