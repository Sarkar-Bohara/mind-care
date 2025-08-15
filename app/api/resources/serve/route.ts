import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import pool from "@/lib/db"
import fs from 'fs'
import path from 'path'

// GET /api/resources/serve/[id] - Serve actual resource files
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    const url = new URL(request.url)
    const resourceId = url.searchParams.get('id')
    
    if (!resourceId) {
      return NextResponse.json(
        { success: false, error: 'Resource ID is required' },
        { status: 400 }
      )
    }
    
    // Get resource details from database
    const result = await pool.query(`
      SELECT resource_id, title, description, content, type, file_path, url
      FROM resources 
      WHERE resource_id = $1
    `, [resourceId])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      )
    }
    
    const resource = result.rows[0]
    
    // If resource has a file_path, serve the actual file
    if (resource.file_path) {
      const filePath = path.join(process.cwd(), 'public', resource.file_path)
      console.log('Attempting to serve file from:', filePath)
      
      try {
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath)
          const fileExtension = path.extname(filePath).toLowerCase()
          
          // Set appropriate content type based on file extension
          let contentType = 'application/octet-stream'
          if (fileExtension === '.pdf') {
            contentType = 'application/pdf'
          } else if (fileExtension === '.txt') {
            contentType = 'text/plain'
          } else if (fileExtension === '.doc' || fileExtension === '.docx') {
            contentType = 'application/msword'
          } else if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
            contentType = 'image/jpeg'
          } else if (fileExtension === '.png') {
            contentType = 'image/png'
          }
          
          // Update view count
          try {
            await pool.query(`
              UPDATE resources 
              SET views = views + 1 
              WHERE resource_id = $1
            `, [resourceId])
          } catch (dbError) {
            console.error('Error updating view count:', dbError)
          }
          
          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `inline; filename="${resource.title}${fileExtension}"`,
              'Cache-Control': 'no-cache'
            }
          })
        }
      } catch (fileError) {
        console.error('Error reading file:', fileError)
      }
    }
    
    // Fallback: serve resource content as HTML for viewing
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${resource.title}</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .meta { color: #666; margin-bottom: 20px; }
            .content { line-height: 1.6; }
        </style>
    </head>
    <body>
        <h1>${resource.title}</h1>
        <div class="meta">
            <p><strong>Type:</strong> ${resource.type}</p>
            <p><strong>Description:</strong> ${resource.description}</p>
        </div>
        <div class="content">
            ${resource.content || 'No content available for this resource.'}
        </div>
    </body>
    </html>
    `
    
    // Update view count
    try {
      await pool.query(`
        UPDATE resources 
        SET views = views + 1 
        WHERE resource_id = $1
      `, [resourceId])
    } catch (dbError) {
      console.error('Error updating view count:', dbError)
    }
    
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    })
    
  } catch (error) {
    console.error('Error serving resource:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to serve resource' },
      { status: 500 }
    )
  }
}