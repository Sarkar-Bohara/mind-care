import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

// GET /api/test-resources - Test resources and their file paths
export async function GET(request: NextRequest) {
  try {
    // Get all resources with their file paths
    const result = await pool.query(`
      SELECT 
        resource_id,
        title,
        type,
        file_path,
        author_id,
        is_published,
        created_at
      FROM resources 
      ORDER BY created_at DESC
    `)

    return NextResponse.json({
      success: true,
      resources: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}