// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// GET - Get counselor's resources
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const category = searchParams.get("category")

    let query = `
      SELECT 
        r.*,
        u.full_name as author_name
      FROM resources r
      JOIN users u ON r.author_id = u.user_id
      WHERE r.author_id = $1
    `
    const params = [user.id]

    if (type) {
      query += ` AND r.type = $${params.length + 1}`
      params.push(type)
    }

    if (category) {
      query += ` AND r.category = $${params.length + 1}`
      params.push(category)
    }

    query += ` ORDER BY r.created_at DESC`

    const result = await pool.query(query, params)

    return NextResponse.json({ resources: result.rows })
  } catch (error) {
    console.error("Error fetching resources:", error)
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    )
  }
}

// POST - Create a new resource
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse FormData
    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    const category = formData.get('category') as string
    const content = formData.get('content') as string
    const url = formData.get('url') as string
    const file = formData.get('file') as File | null

    if (!title || !description || !type || !category) {
      return NextResponse.json(
        { error: "Title, description, type, and category are required" },
        { status: 400 }
      )
    }

    const validTypes = ['article', 'video', 'guide', 'worksheet', 'audio']
    if (!validTypes.includes(type.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      )
    }

    // Handle file upload
    let filePath = null
    if (file && file.size > 0) {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        await mkdir(uploadsDir, { recursive: true })
        
        // Generate unique filename
        const timestamp = Date.now()
        const fileExtension = path.extname(file.name)
        const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const fullPath = path.join(uploadsDir, fileName)
        
        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(fullPath, buffer)
        
        // Store relative path for database
        filePath = `/uploads/${fileName}`
      } catch (fileError) {
        console.error('File upload error:', fileError)
        return NextResponse.json({ error: "File upload failed" }, { status: 500 })
      }
    }

    const result = await pool.query(`
      INSERT INTO resources (
        title, description, type, category, content, url, file_path, 
        author_id, created_at, updated_at, is_published, views, downloads, likes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), true, 0, 0, 0)
      RETURNING *
    `, [title, description, type.toLowerCase(), category, content || null, url || null, filePath, user.id])

    return NextResponse.json({
      success: true,
      message: "Resource created successfully",
      resource: result.rows[0]
    })
  } catch (error) {
    console.error("Error creating resource:", error)
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    )
  }
}

// PUT - Update a resource
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resourceId, title, description, type, category, content, fileUrl, tags } = await request.json()

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      )
    }

    // Verify resource belongs to this counselor
    const resourceCheck = await pool.query(
      "SELECT resource_id FROM resources WHERE resource_id = $1 AND author_id = $2",
      [resourceId, user.id]
    )

    if (resourceCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Resource not found or unauthorized" },
        { status: 404 }
      )
    }

    let updateQuery = "UPDATE resources SET updated_at = NOW()"
    const params = []
    let paramCount = 0

    if (title) {
      paramCount++
      updateQuery += `, title = $${paramCount}`
      params.push(title)
    }

    if (description) {
      paramCount++
      updateQuery += `, description = $${paramCount}`
      params.push(description)
    }

    if (type) {
      paramCount++
      updateQuery += `, type = $${paramCount}`
      params.push(type.toLowerCase())
    }

    if (category) {
      paramCount++
      updateQuery += `, category = $${paramCount}`
      params.push(category)
    }

    if (content !== undefined) {
      paramCount++
      updateQuery += `, content = $${paramCount}`
      params.push(content)
    }

    if (fileUrl !== undefined) {
      paramCount++
      updateQuery += `, url = $${paramCount}`
      params.push(fileUrl)
      paramCount++
      updateQuery += `, file_path = $${paramCount}`
      params.push(fileUrl)
    }

    // Note: tags field not available in resources table

    if (paramCount === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      )
    }

    paramCount++
    updateQuery += ` WHERE resource_id = $${paramCount} RETURNING *`
    params.push(resourceId)

    const result = await pool.query(updateQuery, params)

    return NextResponse.json({
      success: true,
      message: "Resource updated successfully",
      resource: result.rows[0]
    })
  } catch (error) {
    console.error("Error updating resource:", error)
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a resource
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user || user.role !== "counselor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const resourceId = searchParams.get("resourceId")

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      )
    }

    // Verify resource belongs to this counselor
    const result = await pool.query(`
      DELETE FROM resources 
      WHERE resource_id = $1 AND author_id = $2
      RETURNING *
    `, [resourceId, user.id])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Resource not found or unauthorized" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Resource deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting resource:", error)
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    )
  }
}